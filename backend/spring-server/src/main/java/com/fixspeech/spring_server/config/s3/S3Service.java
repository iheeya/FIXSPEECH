package com.fixspeech.spring_server.config.s3;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class S3Service {

	private final AmazonS3 amazonS3;

	@Value("${cloud.aws.s3.bucket}")
	private String bucket;

	private final String DIR_NAME = "record";
	private final String COMPARE_DIR_NAME = "compare";

	public String getBucket() {
		return bucket;
	}

	public String uploadBytes(byte[] bytes, String fileName, String contentType) {
		String newFileName = buildFileName(fileName, "");

		try (ByteArrayInputStream inputStream = new ByteArrayInputStream(bytes)) {
			ObjectMetadata metadata = new ObjectMetadata();
			metadata.setContentLength(bytes.length);
			metadata.setContentType(contentType);

			amazonS3.putObject(new PutObjectRequest(bucket, newFileName, inputStream, metadata)
				.withCannedAcl(CannedAccessControlList.PublicRead));

			return amazonS3.getUrl(bucket, newFileName).toString();

		} catch (IOException e) {
			throw new RuntimeException("Failed to upload file to S3", e);
		}
	}

	// 먼저 MultipartFile을 File로 변환 (이 과정에서 실패 시 예외 발생).
	// 이후 upload(String fileName, File uploadFile, String extend) 메서드를 호출해 실제 업로드를 진행
	public String upload(MultipartFile multipartFile) throws IOException {
		String extension = multipartFile.getOriginalFilename()
			.substring(multipartFile.getOriginalFilename().lastIndexOf("."));

		File uploadFile = convert(multipartFile)
			.orElseThrow(() -> new IllegalArgumentException("MultipartFile -> File 전환 실패"));
		return uploadS3(multipartFile.getOriginalFilename(), uploadFile, extension);
	}

	/**
	 * 커스텀 업로드
	 * @param multipartFile 파일
	 * @param dir 경로
	 * @return uploadS3
	 * @throws IOException
	 */
	public String upload(MultipartFile multipartFile, String dir) throws IOException {
		String extension = multipartFile.getOriginalFilename()
			.substring(multipartFile.getOriginalFilename().lastIndexOf("."));

		File uploadFile = convert(multipartFile)
			.orElseThrow(() -> new IllegalArgumentException("MultipartFile -> File 전환 실패"));
		return uploadS3(multipartFile.getOriginalFilename(), uploadFile, extension, dir);
	}

	// 파일 이름을 고유하게 생성 (buildFileName 메서드 사용)
	// S3에 파일 업로드 (putS3 메서드 사용)
	// 업로드 후 로컬에서 임시로 생성된 파일을 삭제 (removeNewFile 메서드 사용)
	private String uploadS3(String fileName, File uploadFile, String extend) {
		String newFileName = buildFileName(fileName, extend);
		String uploadImageUrl = putS3(uploadFile, newFileName);
		removeNewFile(uploadFile);
		return uploadImageUrl;
	}

	/**
	 * 커스텀 S3 파일 업로드
	 * @param fileName 파일 이름
	 * @param uploadFile 업로드 파일
	 * @param extend 확장자
	 * @param dir 경로
	 * @return S3 업로드 경로
	 */
	private String uploadS3(String fileName, File uploadFile, String extend, String dir) {
		String newFileName = buildFileName(fileName, extend, dir);
		String uploadImageUrl = putS3(uploadFile, newFileName);
		removeNewFile(uploadFile);
		return uploadImageUrl;
	}

	// 기능: 파일 이름에 고유한 UUID를 붙여 중복 방지
	// 작동 방식: 파일 이름이 확장자(extend)로 끝나는 경우 그대로 두고, 그렇지 않으면 확장자를 추가
	private String buildFileName(String fileName, String extend) {
		String uuid = UUID.randomUUID().toString();
		if (fileName.endsWith(extend)) {
			return DIR_NAME + "/" + uuid + "_" + fileName;
		}
		return DIR_NAME + "/" + uuid + "_" + fileName + extend;
	}

	/**
	 * Custom buildFileName
	 * @param fileName 파일 이름
	 * @param extend 확장자
	 * @param dir 경로
	 * @return buildFileName
	 */
	private String buildFileName(String fileName, String extend, String dir) {
		String uuid = UUID.randomUUID().toString();
		if (fileName.endsWith(extend)) {
			return dir + "/" + uuid + "_" + fileName;
		}
		return dir + "/" + uuid + "_" + fileName + extend;
	}

	// PutObjectRequest 객체를 사용해 파일을 S3 버킷에 업로드
	// 업로드된 파일의 URL을 반환
	private String putS3(File uploadFile, String fileName) {
		amazonS3.putObject(
			new PutObjectRequest(bucket, fileName, uploadFile)
				.withCannedAcl(CannedAccessControlList.PublicRead)
		);
		String s3Url = amazonS3.getUrl(bucket, fileName).toString();
		return s3Url;
	}

	// S3에 업로드된 후 로컬에 저장된 임시 파일을 삭제
	private void removeNewFile(File targetFile) {
		if (targetFile.exists()) {
			targetFile.delete();
		}
	}

	// MultipartFile을 File 객체로 변환
	private Optional<File> convert(MultipartFile file) throws IOException {
		File convertFile = File.createTempFile("temp", file.getOriginalFilename()); // 임시 파일 생성
		try (FileOutputStream fos = new FileOutputStream(convertFile)) {
			fos.write(file.getBytes());
		}
		return Optional.of(convertFile);
	}

}
