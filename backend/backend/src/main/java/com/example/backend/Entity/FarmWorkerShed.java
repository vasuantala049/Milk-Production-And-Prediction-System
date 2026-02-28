package com.example.backend.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "farm_worker_sheds", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"farm_worker_id", "shed_id"})
})
public class FarmWorkerShed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_worker_id", nullable = false)
    private FarmWorker farmWorker;

    @ManyToOne
    @JoinColumn(name = "shed_id", nullable = false)
    private Shed shed;
}
