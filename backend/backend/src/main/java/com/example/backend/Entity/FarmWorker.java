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
@Table(name = "farm_workers", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"farm_id", "worker_id"})
})
public class FarmWorker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne
    @JoinColumn(name = "worker_id", nullable = false)
    private User worker;

    @JsonIgnore
    @OneToMany(mappedBy = "farmWorker", cascade = CascadeType.ALL)
    private List<FarmWorkerShed> shedAssignments;
}
