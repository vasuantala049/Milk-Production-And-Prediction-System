package com.example.backend.DTO;
import com.example.backend.Entity.type.MilkSession;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MilkBuyDto {
    @NotNull
    private Double quantity;

    @NotNull
    private MilkSession session;

    @NotNull
    private LocalDate date;

    @NotNull
    private Long farmId;

}
