package com.example.backend.Entity;

import com.example.backend.Entity.type.MilkSession;
import com.example.backend.Entity.type.OrderStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "orders", indexes = {
        @Index(name = "idx_order_date", columnList = "orderDate"),
        @Index(name = "idx_order_status", columnList = "status"),
        @Index(name = "idx_order_farm", columnList = "farm_id")
})
public class Orders {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate orderDate;

    private Double quantity;

    private OrderStatus status; // PENDING / COMPLETED / CANCELLED

    private MilkSession session; //MORNING / EVENING

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
}
