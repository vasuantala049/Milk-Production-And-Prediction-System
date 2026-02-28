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
@Table(name = "sheds", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "farm_id", "name" })
})
public class Shed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(nullable = false)
    private String name;

    @JsonIgnore
    @OneToMany(mappedBy = "shed")
    private List<Cattle> cattleList;

    @JsonIgnore
    @OneToMany(mappedBy = "shed")
    private List<FarmWorkerShed> workerAssignments;
}
