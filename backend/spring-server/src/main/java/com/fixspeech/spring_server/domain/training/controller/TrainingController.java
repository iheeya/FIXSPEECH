package com.fixspeech.spring_server.domain.training.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fixspeech.spring_server.domain.grass.service.GrassService;
import com.fixspeech.spring_server.domain.training.service.TrainingService;
import com.fixspeech.spring_server.domain.user.model.Users;
import com.fixspeech.spring_server.domain.user.service.UserService;
import com.fixspeech.spring_server.global.common.ApiResponse;
import com.fixspeech.spring_server.global.exception.CustomException;
import com.fixspeech.spring_server.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/*
1. 랜덤으로 문장 반환
2. 사용자 녹음 데이터 입력받고, 값 비교
3. 내가 녹음한 목소리 다시 듣기

 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/training")
public class TrainingController implements TrainingApi {
	private final TrainingService trainingService;
	private final UserService userService;
	private final GrassService grassService;

	@GetMapping("/{trainingId}/start")
	public ApiResponse<?> start(
		@AuthenticationPrincipal UserDetails userDetails,
		@PathVariable Long trainingId) {
		try {
			Users users = userService.findByEmail(userDetails.getUsername())
				.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
			String s = trainingService.getSentence(users, trainingId);
			return ApiResponse.createSuccess(s, "연습 문장 불러오기 성공");
		} catch (Exception e) {
			throw new CustomException(ErrorCode.FAIL_TO_UPLOAD_RECORD);
		}
	}

	@PostMapping("/end")
	public ApiResponse<?> end(
		@AuthenticationPrincipal UserDetails userDetails
	) {
		Users users = userService.findByEmail(userDetails.getUsername())
			.orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
		trainingService.deleteRedis(users);
		grassService.addGrassRecord(users.getId());
		return ApiResponse.success("훈련 종료 완료");
	}

}
