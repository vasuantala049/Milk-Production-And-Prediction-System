package com.example.backend.Service;

import com.example.backend.DTO.CreateUserRequestDto;
import com.example.backend.DTO.UserPatchDto;
import com.example.backend.DTO.UserResponseDto;
import jakarta.validation.Valid;

public interface UserService {

    UserResponseDto createNewUser(@Valid CreateUserRequestDto request);

    UserResponseDto getUserById(Long id);

    UserResponseDto updateUser(Long id, @Valid CreateUserRequestDto request);

    UserResponseDto patchUser(Long id, UserPatchDto patchDto, com.example.backend.Entity.User loggedInUser);
}
