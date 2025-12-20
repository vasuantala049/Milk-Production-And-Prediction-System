package com.example.backend.Repository;

import com.example.backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findUsersById(Long id);
    java.util.Optional<User> findByEmail(String email);
    java.util.Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);
}