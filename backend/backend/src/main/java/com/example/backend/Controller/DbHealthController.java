package com.example.backend.Controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
public class DbHealthController {

    private final DataSource dataSource;

    public DbHealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/users/db-test")
    public String checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return "DB OK";
            }
            return "DB NOT READY";
        } catch (Exception e) {
            throw new RuntimeException("Database connection failed", e);
        }
    }
}

