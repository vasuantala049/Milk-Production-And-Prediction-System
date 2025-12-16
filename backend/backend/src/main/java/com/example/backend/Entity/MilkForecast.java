package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
@Table(name = "milk_forecast")
public class MilkForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate forecastDate;

    @Column(name = "predicted_liters")
    private Double predictedLiters;

    private String method; // MOVING_AVERAGE, etc.

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;
}
