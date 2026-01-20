package com.example.backend.Repository;

import com.example.backend.Entity.Orders;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.backend.Entity.User;
import java.util.List;


@Repository
public interface OrdersRepository extends JpaRepository<Orders, Long> {
    List<Orders> findByBuyer(User buyer);
}