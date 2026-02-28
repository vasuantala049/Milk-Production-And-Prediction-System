package com.example.backend.Controller;
import com.example.backend.DTO.UserPatchDto;
import com.example.backend.DTO.UserResponseDto;
import com.example.backend.Repository.UserRepository;
import jakarta.validation.Valid;
import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.Service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponseDto> createNewUser(
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(userService.createNewUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponseDto> updateUser(
            @PathVariable Long id,
            @RequestBody @Valid CreateUserRequestDto request) {

        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<UserResponseDto> patchUser(
            @PathVariable Long id,
            @RequestBody UserPatchDto patchDto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.example.backend.Entity.User user) {

        return ResponseEntity.ok(userService.patchUser(id, patchDto, user));
    }

    @GetMapping("/db-test")
    public String testDb() {
        userRepository.count();
        return "DB OK";
    }
}
