package com.example.backend.Repository;

import com.example.backend.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findUsersById(Long id);

    java.util.Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.assignedFarms WHERE u.email = :email")
    java.util.Optional<User> findByEmailWithAssignedFarms(String email);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.assignedFarms WHERE u.id = :id")
    java.util.Optional<User> findByIdWithAssignedFarms(Long id);

    java.util.Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    long countByAssignedFarms_IdAndRole(Long farmId, com.example.backend.Entity.type.UserRole role);

    java.util.List<com.example.backend.Entity.User> findByAssignedFarms_IdAndRole(Long farmId,
            com.example.backend.Entity.type.UserRole role);

    boolean existsByEmail(String email);

}