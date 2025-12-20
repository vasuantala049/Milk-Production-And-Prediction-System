package com.example.backend;

import com.example.backend.Controller.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import com.example.backend.Controller.UserController;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ActiveProfiles;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@AutoConfigureMockMvc
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class BackendApplicationTests {
	@Autowired
	private MockMvc mockMvc;

	@Test
	void shouldHitDbAndReturnOk() throws Exception {
		mockMvc.perform(get("/api/test-db"))
				.andExpect(status().isOk())
				.andExpect(content().string("DB OK"));
	}

}
