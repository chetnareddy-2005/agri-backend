package com.farmerretailer.controller;

import com.farmerretailer.dto.ProductDTO;
import com.farmerretailer.entity.Product;
import com.farmerretailer.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping("/add")
    public ResponseEntity<?> addProduct(@RequestBody ProductDTO productDTO, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        try {
            Product product = productService.createProduct(productDTO, principal.getName());
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<com.farmerretailer.dto.ProductSummaryDTO>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProductSummaries());
    }

    @GetMapping("/my-products")
    public ResponseEntity<?> getMyProducts(Principal principal) {
        if (principal == null) {
            System.err.println("DEBUG: getMyProducts - Principal is NULL!");
            return ResponseEntity.status(401).build();
        }
        String email = principal.getName();
        System.out.println("DEBUG: Fetching products for farmer email: " + email);
        try {
            List<Product> products = productService.getFarmerProducts(email);
            System.out.println("DEBUG: Successfully fetched " + products.size() + " products for email: " + email);
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            System.err.println("DEBUG: Error in getMyProducts for " + email + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Internal Server Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody ProductDTO productDTO,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        try {
            Product updatedProduct = productService.updateProduct(id, productDTO, principal.getName());
            return ResponseEntity.ok(updatedProduct);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        try {
            productService.deleteProduct(id, principal.getName());
            return ResponseEntity.ok("Product deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/image")
    public ResponseEntity<String> getProductImage(@PathVariable Long id) {
        String imageUrl = productService.getProductFirstImage(id);
        if (imageUrl != null) {
            return ResponseEntity.ok(imageUrl);
        }
        return ResponseEntity.status(404).body("Image not found");
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<String>> getProductAllImages(@PathVariable Long id) {
        List<String> images = productService.getProductAllImages(id);
        return ResponseEntity.ok(images);
    }
}
