package com.example.backend.Entity;

import com.example.backend.Entity.type.MilkSession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder

@Table(name = "milk_inventory",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"record_date", "farm_id", "session"})
        })
public class MilkInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate recordDate;

    @Enumerated(EnumType.STRING)
    private MilkSession session; // MORNING / EVENING

    @Column(name = "milk_liters", nullable = false)
    private Double milkLiters;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne
    @JoinColumn(name = "entered_by", nullable = false)
    private User enteredBy;
}
