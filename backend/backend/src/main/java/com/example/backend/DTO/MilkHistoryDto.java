package com.example.backend.DTO;

import java.time.LocalDate;

public class MilkHistoryDto {
    private LocalDate date;
    private Double total;

    public MilkHistoryDto() {}

    public MilkHistoryDto(LocalDate date, Double total) {
        this.date = date;
        this.total = total;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}
