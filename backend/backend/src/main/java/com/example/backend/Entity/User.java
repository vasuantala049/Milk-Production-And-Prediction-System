package com.example.backend.Entity;
import com.example.backend.Entity.type.UserRole;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users", indexes = {
        @Index(name = "idx_user_city", columnList = "city")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = true)
    private String location;

    private String city;  // User's city for location-based farm filtering

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    private String shed;

    @Column(name = "oauth_provider_id")
    private String oauthProviderId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // Worker-farm assignments (many-to-many)
    @JsonIgnore
    @ManyToMany
    @JoinTable(
            name = "farm_workers",
            joinColumns = @JoinColumn(name = "worker_id"),
            inverseJoinColumns = @JoinColumn(name = "farm_id")
    )
    private List<Farm> assignedFarms;


    // one user can own multiple farms
    @JsonIgnore
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Farm> farms;

    // buyer side
    @JsonIgnore
    @OneToMany(mappedBy = "buyer")
    private List<Orders> orders;
}
