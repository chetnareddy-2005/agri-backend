package com.farmerretailer.service;

import com.farmerretailer.dto.ProductDTO;
import com.farmerretailer.entity.Product;
import com.farmerretailer.entity.Order;
import com.farmerretailer.entity.User;
import com.farmerretailer.model.Role;
import com.farmerretailer.repository.ProductRepository;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.farmerretailer.repository.OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Product createProduct(ProductDTO productDTO, String farmerEmail) {
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        if (!farmer.getRole().equals(Role.FARMER)) {
            System.out.println("DEBUG: Role Mismatch!");
            System.out.println("User Email: " + farmer.getEmail());
            System.out.println("User Role: " + farmer.getRole());
            System.out.println("Expected Role: " + Role.FARMER);
            throw new RuntimeException("Only farmers can list products. Current role: " + farmer.getRole());
        }

        Product product = new Product(
                productDTO.getName(),
                productDTO.getCategory(),
                productDTO.getQuantity(),
                productDTO.getUnit(),
                productDTO.getPrice(),
                farmer);
        product.setDescription(productDTO.getDescription());
        product.setDeliveryEstimate(productDTO.getDeliveryEstimate());
        product.setLocation(productDTO.getLocation());
        product.setBiddingStartTime(productDTO.getBiddingStartTime());
        product.setBiddingEndTime(productDTO.getBiddingEndTime());
        product.setImageUrls(productDTO.getImageUrls());
        product.setListingType(productDTO.getListingType());

        Product savedProduct = productRepository.save(product);

        // Notify all retailers
        try {
            notifyRetailers(savedProduct);
        } catch (Exception e) {
            System.err.println("Failed to send email notifications: " + e.getMessage());
        }

        return savedProduct;
    }

    private void notifyRetailers(Product product) {
        List<User> retailers = userRepository.findByRole(Role.RETAILER);
        String productLink = "http://localhost:5173/retailer/dashboard"; // Link to dashboard

        for (User retailer : retailers) {
            // Email Notification
            emailService.sendNewProductNotification(
                    retailer.getEmail(),
                    product.getName(),
                    product.getFarmer().getFullName(),
                    productLink);

            // Dashboard Notification
            notificationService.createNotification(
                    retailer,
                    "New Product Listed",
                    "A new product '" + product.getName() + "' is available now.",
                    "info");
        }
    }

    @Transactional(readOnly = true)
    public java.util.List<com.farmerretailer.dto.ProductSummaryDTO> getAllProductSummaries() {
        return productRepository.findAll().stream()
                .map(product -> {
                    String winnerName = null;
                    if (product.getOrders() != null && !product.getOrders().isEmpty()) {
                        if ("DIRECT".equals(product.getListingType())) {
                            winnerName = product.getOrders().stream()
                                    .map(order -> order.getRetailer().getFullName())
                                    .distinct()
                                    .collect(java.util.stream.Collectors.joining(", "));
                        } else {
                            winnerName = product.getOrders().get(0).getRetailer().getFullName();
                        }
                    }

                    boolean isAvailable = product.isAvailable();
                    if (product.getQuantity() != null && product.getQuantity() <= 0) {
                        isAvailable = false;
                    }

                    return new com.farmerretailer.dto.ProductSummaryDTO(
                            product.getId(),
                            product.getName(),
                            product.getCategory(),
                            product.getDescription(),
                            product.getQuantity(),
                            product.getUnit(),
                            product.getPrice(),
                            product.getDeliveryEstimate(),
                            product.getLocation(),
                            product.getBiddingStartTime(),
                            product.getBiddingEndTime(),
                            product.getFarmer().getFullName(),
                            winnerName,
                            isAvailable,
                            product.getListingType());
                })
                .collect(java.util.stream.Collectors.toList());
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public String getProductFirstImage(Long productId) {
        if (productId == null)
            return null;
        Product product = productRepository.findById(productId).orElse(null);
        if (product != null && product.getImageUrls() != null && !product.getImageUrls().isEmpty()) {
            return product.getImageUrls().get(0);
        }
        return null;
    }

    public List<String> getProductAllImages(Long productId) {
        if (productId == null)
            return java.util.Collections.emptyList();
        Product product = productRepository.findById(productId).orElse(null);
        if (product != null && product.getImageUrls() != null) {
            return product.getImageUrls();
        }
        return List.of();
    }

    @Autowired
    private com.farmerretailer.repository.BidRepository bidRepository;

    public List<Product> getFarmerProducts(String email) {
        User farmer = userRepository.findByEmail(email).orElseThrow();
        List<Product> products = productRepository.findByFarmerId(farmer.getId());
        for (Product product : products) {
            Double maxBid = bidRepository.findHighestBidAmountByProductId(product.getId());
            product.setHighestBid(maxBid != null ? maxBid : 0.0);
            if (product.getOrders() != null && !product.getOrders().isEmpty()) {
                product.setWinnerName(product.getOrders().get(0).getRetailer().getFullName());

                java.util.List<Product.BuyerInfo> buyerList = new java.util.ArrayList<>();
                for (Order order : product.getOrders()) {
                    buyerList.add(new Product.BuyerInfo(order.getRetailer().getFullName(), order.getQuantity()));
                }
                product.setBuyers(buyerList);
            }
        }
        return products;
    }

    @Transactional
    public Product updateProduct(Long productId, ProductDTO productDTO, String email) {
        if (productId == null)
            throw new IllegalArgumentException("Product ID cannot be null");
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getFarmer().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized to update this product");
        }

        // Capture old values for notification
        Double oldPrice = product.getPrice();
        Double oldQuantity = product.getQuantity();

        product.setName(productDTO.getName());
        product.setCategory(productDTO.getCategory());
        product.setDescription(productDTO.getDescription());
        product.setQuantity(productDTO.getQuantity());
        product.setUnit(productDTO.getUnit());
        product.setPrice(productDTO.getPrice());
        product.setDeliveryEstimate(productDTO.getDeliveryEstimate());
        product.setLocation(productDTO.getLocation());
        product.setBiddingStartTime(productDTO.getBiddingStartTime());
        product.setBiddingEndTime(productDTO.getBiddingEndTime());
        product.setListingType(productDTO.getListingType());

        if (productDTO.getImageUrls() != null && !productDTO.getImageUrls().isEmpty()) {
            product.setImageUrls(productDTO.getImageUrls());
        }

        Product savedProduct = productRepository.save(product);

        // Notify Retailers if Price or Quantity changed
        try {
            List<User> retailers = userRepository.findByRole(Role.RETAILER);

            // Price Update Notification
            if (Double.compare(oldPrice, savedProduct.getPrice()) != 0) {
                for (User retailer : retailers) {
                    notificationService.createNotification(
                            retailer,
                            "Price Update Alert",
                            "The price for '" + savedProduct.getName() + "' has been updated from ₹" + oldPrice
                                    + " to ₹" + savedProduct.getPrice() + ".",
                            "alert");
                }
            }

            // Stock Update Notification (Left Over / Restock)
            if (Double.compare(oldQuantity, savedProduct.getQuantity()) != 0) {
                // Only notify if it's significant? For now, any change by Farmer is relevant.
                for (User retailer : retailers) {
                    notificationService.createNotification(
                            retailer,
                            "Stock Update",
                            "Stock updated for '" + savedProduct.getName() + "'. Available: "
                                    + savedProduct.getQuantity() + " " + savedProduct.getUnit() + ".",
                            "info");
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to send update notifications: " + e.getMessage());
        }

        return savedProduct;
    }

    @Transactional
    public void deleteProduct(Long productId, String email) {
        if (productId == null)
            throw new IllegalArgumentException("Product ID cannot be null");
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.getFarmer().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized to delete this product");
        }

        if (orderRepository.existsByProductId(productId)) {
            throw new RuntimeException("Cannot delete product as it has associated orders.");
        }

        bidRepository.deleteByProductId(productId);
        productRepository.delete(product);
    }
}

