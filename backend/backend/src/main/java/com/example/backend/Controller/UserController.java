package com.example.backend.Controller;
import com.example.backend.DTO.UserResponseDto;
import jakarta.validation.Valid;
import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    // GET user by id
    @GetMapping("/{id}")
    public ResponseEntity<List<UserResponseDto>> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // CREATE user
    @PostMapping
    public ResponseEntity<UserResponseDto> createNewUser(
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createNewUser(request));
    }

    // UPDATE full user (PUT)
    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    // UPDATE partial user (PATCH)
    @PatchMapping("/{id}")
    public ResponseEntity<UserResponseDto> patchUser(
            @PathVariable Long id,
            @RequestBody Map<String,Object> updates) {

        return ResponseEntity.ok(userService.patchUser(id, updates));
    }
}