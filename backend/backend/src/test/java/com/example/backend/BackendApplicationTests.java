package com.example.backend;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(
        properties = "spring.profiles.active=test"
)
@AutoConfigureMockMvc(addFilters = false) // disables security for this test
class UserDbTestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void dbTest_shouldReturnOk() throws Exception {
        mockMvc.perform(get("/users/db-test"))
                .andExpect(status().isOk())
                .andExpect(content().string("DB OK"));
    }
}

