package com.example.backend.Entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "farms", indexes = {
        @Index(name = "idx_farm_city", columnList = "city")
})
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String city;

    private String address;

    @Builder.Default
    private boolean isSelling = false;

    private Double pricePerLiter;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @JsonIgnore
    @OneToMany(mappedBy = "farm", cascade = CascadeType.ALL)
    private List<Cattle> cattleList;

    // Workers assigned to this farm (many-to-many with users)
    @JsonIgnore
    @ManyToMany(mappedBy = "assignedFarms")
    private List<User> workers;
}
