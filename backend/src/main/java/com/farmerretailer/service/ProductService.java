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
        System.out.println("DEBUG: Creating product for farmer email: " + farmerEmail);
        User farmer = userRepository.findByEmail(farmerEmail)
                .orElseThrow(() -> new RuntimeException("Farmer not found"));

        if (!farmer.getRole().equals(Role.FARMER)) {
            System.out.println("DEBUG: Role Mismatch! Found: " + farmer.getRole());
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
        System.out.println("DEBUG: Product saved successfully with ID: " + savedProduct.getId() + " Linked to Farmer ID: " + farmer.getId());

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

    @Transactional(readOnly = true)
    public List<Product> getFarmerProducts(String email) {
        System.out.println("DEBUG: getFarmerProducts called for email: " + email);
        User farmer = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Farmer not found for email: " + email));
        
        System.out.println("DEBUG: Found farmer with ID: " + farmer.getId());
        List<Product> products = productRepository.findByFarmerId(farmer.getId());
        System.out.println("DEBUG: Found " + products.size() + " products for farmer ID: " + farmer.getId());

        for (Product product : products) {
            try {
                // Initialize highest bid
                Double maxBid = bidRepository.findHighestBidAmountByProductId(product.getId());
                product.setHighestBid(maxBid != null ? maxBid : 0.0);
                
                double totalSold = 0.0;
                // Initialize orders and buyers info
                if (product.getOrders() != null && !product.getOrders().isEmpty()) {
                    // Safe access to first order's retailer
                    Order firstOrder = product.getOrders().get(0);
                    if (firstOrder.getRetailer() != null) {
                        product.setWinnerName(firstOrder.getRetailer().getFullName());
                    }

                    java.util.List<Product.BuyerInfo> buyerList = new java.util.ArrayList<>();
                    for (Order order : product.getOrders()) {
                        if (order.getRetailer() != null) {
                            buyerList.add(new Product.BuyerInfo(order.getRetailer().getFullName(), order.getQuantity()));
                        }
                        totalSold += (order.getQuantity() != null ? order.getQuantity() : 0.0);
                    }
                    product.setBuyers(buyerList);
                }
                
                // Dynamic check for availability
                if (product.getQuantity() != null && product.getQuantity() <= 0 && product.isAvailable()) {
                    product.setAvailable(false);
                    // We don't save here in readOnly transaction, but JpaRepository might handle it if we remove readOnly
                    // Actually, let's remove readOnly=true because we might update availability
                }
                
                System.out.println("DEBUG: Processed product " + product.getName() + " (ID: " + product.getId() + ") - Left: " + product.getQuantity() + ", Sold: " + totalSold);
            } catch (Exception e) {
                System.err.println("DEBUG: Error processing product ID " + product.getId() + ": " + e.getMessage());
                e.printStackTrace();
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

