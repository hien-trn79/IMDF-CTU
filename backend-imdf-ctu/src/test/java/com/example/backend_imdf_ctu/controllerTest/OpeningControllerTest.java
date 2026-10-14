package com.example.backend_imdf_ctu.controllerTest;

import com.example.backend_imdf_ctu.controller.OpeningController;
import com.example.backend_imdf_ctu.dto.request.GeoJsonGeometry;
import com.example.backend_imdf_ctu.dto.request.OpeningRequest;
import com.example.backend_imdf_ctu.dto.response.OpeningResponse;
import com.example.backend_imdf_ctu.exception.BusinessException;
import com.example.backend_imdf_ctu.exception.ErrorCode;
import com.example.backend_imdf_ctu.exception.InvalidGeometryException;
import com.example.backend_imdf_ctu.repository.UserRepository;
import com.example.backend_imdf_ctu.service.interfaces.JwtService;
import com.example.backend_imdf_ctu.service.interfaces.OpeningService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    controllers = OpeningController.class,
    properties = "spring.data.web.pageable.max-page-size=100")
@AutoConfigureMockMvc(addFilters = false)
class OpeningControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private OpeningService service;

    private static final String GEOMETRY = """
            "geometry": {"type": "LineString", "coordinates": [[105.0, 10.0], [105.001, 10.0]]}
            """;

    private static final String DISPLAY_POINT = """
            "displayPoint": {"type": "Point", "coordinates": [105.0005, 10.0]}
            """;

    private static final String VALID_BODY = "{"
        + "\"openingName\": \"Cửa chính\", \"unitId\": 1, \"openingCategoryId\": 1,"
        + GEOMETRY + "," + DISPLAY_POINT + "}";

    /** displayPoint là tùy chọn: mapper tự tính khi thiếu. */
    private static final String BODY_WITHOUT_DISPLAY_POINT = "{"
        + "\"openingName\": \"Cửa chính\", \"unitId\": 1, \"openingCategoryId\": 1,"
        + GEOMETRY + "}";

    /** Mỗi body thiếu đúng một trường bắt buộc (điều chỉnh theo ràng buộc thật của OpeningRequest). */
    static Stream<String> bodiesMissingRequiredField() {
        return Stream.of(
            "{\"unitId\": 1, \"openingCategoryId\": 1," + GEOMETRY + "}",                         // thiếu openingName
            "{\"openingName\": \"Cửa\", \"openingCategoryId\": 1," + GEOMETRY + "}",             // thiếu unitId
            "{\"openingName\": \"Cửa\", \"unitId\": 1," + GEOMETRY + "}",                        // thiếu openingCategoryId
            "{\"openingName\": \"Cửa\", \"unitId\": 1, \"openingCategoryId\": 1}",               // thiếu geometry
            "{}");
    }

    // ---------- GET /openings ----------

    @Test
    @DisplayName("GET /openings trả 200 và danh sách trong content")
    void list_returnsPage() throws Exception {
        OpeningResponse r = new OpeningResponse();
        r.setId(1);
        given(service.getAll(any(Pageable.class)))      // đổi thành list(...) nếu service dùng tên đó
            .willReturn(new PageImpl<>(List.of(r), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/openings"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].id").value(1));
    }

    @Test
    @DisplayName("page, size, sort được chuyển đúng xuống service")
    void list_passesPagingAndSort() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/openings").param("page", "2").param("size", "5").param("sort", "id,desc"))
            .andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isEqualTo(2);
        assertThat(captor.getValue().getPageSize()).isEqualTo(5);
        assertThat(captor.getValue().getSort().getOrderFor("id").getDirection())
            .isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("Không gửi tham số: trang 0, kích thước 20")
    void list_usesDefaults() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/openings")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageNumber()).isZero();
        assertThat(captor.getValue().getPageSize()).isEqualTo(20);
    }

    @Test
    @DisplayName("size quá lớn bị chặn ở mức tối đa 100")
    void list_capsPageSize() throws Exception {
        given(service.getAll(any(Pageable.class))).willReturn(Page.empty());

        mockMvc.perform(get("/openings").param("size", "100000")).andExpect(status().isOk());

        ArgumentCaptor<Pageable> captor = ArgumentCaptor.forClass(Pageable.class);
        verify(service).getAll(captor.capture());
        assertThat(captor.getValue().getPageSize()).isEqualTo(100);
    }

    // ---------- GET /openings/{id} ----------

    @Test
    @DisplayName("GET /openings/{id} trả 200 và hình học xuất ra dạng GeoJSON")
    void getById_ok_serializesGeometry() throws Exception {
        OpeningResponse r = new OpeningResponse();
        r.setId(7);
        r.setGeometry(new GeoJsonGeometry("LineString",
            List.of(List.of(105.0, 10.0), List.of(105.001, 10.0))));
        given(service.getById(7)).willReturn(r);

        mockMvc.perform(get("/openings/7"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(7))
            .andExpect(jsonPath("$.geometry.type").value("LineString"))
            .andExpect(jsonPath("$.geometry.coordinates[0][0]").value(105.0));
    }

    @Test
    @DisplayName("GET /openings/{id} không tồn tại trả 404")
    void getById_notFound() throws Exception {
        given(service.getById(99)).willThrow(new BusinessException(ErrorCode.OPENING_NOT_FOUND));

        mockMvc.perform(get("/openings/99")).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("id không phải số trả 400, không gọi service")
    void getById_nonNumericId() throws Exception {
        mockMvc.perform(get("/openings/abc"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    // ---------- POST /openings ----------

    @Test
    @DisplayName("POST hợp lệ trả 201 và hình học được đọc đúng vào request")
    void create_ok() throws Exception {
        given(service.create(any(OpeningRequest.class))).willReturn(new OpeningResponse());

        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isCreated());

        ArgumentCaptor<OpeningRequest> captor = ArgumentCaptor.forClass(OpeningRequest.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue().getOpeningName()).isEqualTo("Cửa chính");
        assertThat(captor.getValue().getUnitId()).isEqualTo(1);
        assertThat(captor.getValue().getOpeningCategoryId()).isEqualTo(1);
        assertThat(captor.getValue().getGeometry().type()).isEqualTo("LineString");
    }

    @Test
    @DisplayName("POST không có displayPoint vẫn hợp lệ (trường tùy chọn)")
    void create_withoutDisplayPoint() throws Exception {
        given(service.create(any(OpeningRequest.class))).willReturn(new OpeningResponse());

        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON)
                .content(BODY_WITHOUT_DISPLAY_POINT))
            .andExpect(status().isCreated());

        ArgumentCaptor<OpeningRequest> captor = ArgumentCaptor.forClass(OpeningRequest.class);
        verify(service).create(captor.capture());
        assertThat(captor.getValue().getDisplayPoint()).isNull();
    }

    @Test
    @DisplayName("JSON sai cú pháp trả 400, không gọi service")
    void create_malformedJson() throws Exception {
        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON).content("{ không phải json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "POST thiếu trường bắt buộc #{index} trả 400")
    @MethodSource("bodiesMissingRequiredField")
    @DisplayName("POST thiếu trường bắt buộc trả 400, không gọi service")
    void create_missingRequiredField(String body) throws Exception {
        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @ParameterizedTest(name = "POST: {0} được ánh xạ thành 404")
    @EnumSource(value = ErrorCode.class, names = {"UNIT_NOT_FOUND", "OPENING_CATEGORY_NOT_FOUND"})
    @DisplayName("POST: thực thể liên quan không tồn tại trả 404")
    void create_relatedEntityNotFound(ErrorCode code) throws Exception {
        given(service.create(any(OpeningRequest.class))).willThrow(new BusinessException(code));

        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST: hình học sai kiểu bị tầng dưới từ chối được ánh xạ thành 400")
    void create_invalidGeometry() throws Exception {
        given(service.create(any(OpeningRequest.class)))
            .willThrow(new BusinessException(ErrorCode.INVALID_GEOMETRY, "Opening chỉ chấp nhận LineString"));

        mockMvc.perform(post("/openings").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    // ---------- PUT /openings/{id} ----------

    @Test
    @DisplayName("PUT trả 200 và gọi update đúng id")
    void update_ok() throws Exception {
        given(service.update(eq(5), any(OpeningRequest.class))).willReturn(new OpeningResponse());

        mockMvc.perform(put("/openings/5").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isOk());

        verify(service).update(eq(5), any(OpeningRequest.class));
    }

    @ParameterizedTest(name = "PUT thiếu trường bắt buộc #{index} trả 400")
    @MethodSource("bodiesMissingRequiredField")
    @DisplayName("PUT thiếu trường bắt buộc trả 400, không gọi service")
    void update_missingRequiredField(String body) throws Exception {
        mockMvc.perform(put("/openings/5").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
        verifyNoInteractions(service);
    }

    @Test
    @DisplayName("PUT opening không tồn tại trả 404")
    void update_notFound() throws Exception {
        given(service.update(eq(99), any(OpeningRequest.class)))
            .willThrow(new BusinessException(ErrorCode.OPENING_NOT_FOUND));

        mockMvc.perform(put("/openings/99").contentType(MediaType.APPLICATION_JSON).content(VALID_BODY))
            .andExpect(status().isNotFound());
    }

    // ---------- DELETE /openings/{id} ----------

    @Test
    @DisplayName("DELETE trả 204 và gọi delete đúng id")
    void delete_ok() throws Exception {
        mockMvc.perform(delete("/openings/5")).andExpect(status().isNoContent());
        verify(service).delete(5);
    }

    @Test
    @DisplayName("DELETE opening không tồn tại trả 404")
    void delete_notFound() throws Exception {
        doThrow(new BusinessException(ErrorCode.OPENING_NOT_FOUND)).when(service).delete(99);

        mockMvc.perform(delete("/openings/99")).andExpect(status().isNotFound());
    }
}