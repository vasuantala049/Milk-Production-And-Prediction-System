package com.example.backend.DTO;

import java.time.LocalDate;

public class MilkTypeHistoryDto {
    private LocalDate date;
    private String animalType;
    private Double morning;
    private Double evening;
    private Double total;

    public MilkTypeHistoryDto() {}

    public MilkTypeHistoryDto(LocalDate date, String animalType, Double morning, Double evening, Double total) {
        this.date = date;
        this.animalType = animalType;
        this.morning = morning;
        this.evening = evening;
        this.total = total;
    }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getAnimalType() { return animalType; }
    public void setAnimalType(String animalType) { this.animalType = animalType; }

    public Double getMorning() { return morning; }
    public void setMorning(Double morning) { this.morning = morning; }

    public Double getEvening() { return evening; }
    public void setEvening(Double evening) { this.evening = evening; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }
}