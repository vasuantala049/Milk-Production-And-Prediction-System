package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "cattle")
public class Cattle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tag_id", nullable = false)
    private String tagId;

    private String breed;

    private String type;

    private LocalDateTime dob;

    private Long weight;
    private String status; // ACTIVE / SICK / SOLD

    private String shed;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;


}
