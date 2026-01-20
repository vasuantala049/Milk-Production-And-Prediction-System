package com.example.backend.Entity;
import com.example.backend.Entity.type.UserRole;
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
@Table(name = "users")
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    @Column(name = "oauth_provider_id")
    private String oauthProviderId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    // Worker-farm assignments (many-to-many)
    @ManyToMany
    @JoinTable(
            name = "farm_workers",
            joinColumns = @JoinColumn(name = "worker_id"),
            inverseJoinColumns = @JoinColumn(name = "farm_id")
    )
    private List<Farm> assignedFarms;


    // one user can own multiple farms
    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Farm> farms;

    // buyer side
    @OneToMany(mappedBy = "buyer")
    private List<Orders> orders;
}
