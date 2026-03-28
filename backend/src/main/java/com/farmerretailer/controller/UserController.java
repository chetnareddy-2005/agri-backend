package com.farmerretailer.controller;

import com.farmerretailer.entity.User;
import com.farmerretailer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}/document")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<byte[]> getUserDocument(@PathVariable Long userId) {
        System.out.println("Fetching document for user ID: " + userId);
        Optional<User> userOptional = userRepository.findById(userId);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            byte[] fileContent = user.getDocumentContent();
            String contentType = user.getDocumentContentType();
            String fileName = user.getDocumentName();

            if (fileContent == null || fileContent.length == 0) {
                System.out.println("Document content is empty for user: " + userId);
                return ResponseEntity.notFound().build();
            }

            System.out.println("Returning document: " + fileName + " (" + fileContent.length + " bytes)");
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .contentType(contentType != null ? MediaType.parseMediaType(contentType)
                            : MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileContent);
        } else {
            System.out.println("User not found: " + userId);
            return ResponseEntity.notFound().build();
        }
    }
}
