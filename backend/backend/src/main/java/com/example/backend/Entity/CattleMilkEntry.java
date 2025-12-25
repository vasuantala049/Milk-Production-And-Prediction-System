package com.example.backend.Entity;


import com.example.backend.Entity.type.MilkSession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
        name = "cattle_milk_entry",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"cattle_id", "record_date", "session"}
                )
        }
)
public class CattleMilkEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MilkSession session; // MORNING / EVENING

    @Column(name = "milk_liters", nullable = false)
    private Double milkLiters;

    // 🔑 resolved from tagId internally
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cattle_id", nullable = false)
    private Cattle cattle;

    // tenant isolation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    // audit
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by", nullable = false)
    private User enteredBy;
}
