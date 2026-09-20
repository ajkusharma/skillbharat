package com.skillbharat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The MVP success scenario, end to end against a real PostgreSQL (Testcontainers, needs Docker):
 * candidate registers, builds a profile, uploads a resume, finds a job, applies; the employer (approved by
 * the admin, with a job approved by the admin) sees the application and shortlists it; the candidate sees
 * SHORTLISTED; the admin can see the whole trail. Also checks the key RBAC and ownership rules.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestPropertySource(properties = {
        "app.seed.enabled=false",
        "app.bootstrap-admin.email=admin@test.in",
        "app.bootstrap-admin.password=Admin@1234",
        "app.storage.local-dir=target/test-resumes"
})
class WorkflowIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    // state shared across the ordered steps
    static String adminToken;
    static String employerToken;
    static String otherEmployerToken;
    static String candidateToken;
    static String otherCandidateToken;
    static long companyId;
    static long jobId;
    static long applicationId;
    static long resumeId;
    static long skillId;
    static String category;

    @Test
    @Order(1)
    void adminAndEmployerAreSetUpAndApproved() throws Exception {
        adminToken = login("admin@test.in", "Admin@1234");

        JsonNode reg = call(post("/api/auth/register/employer"), null, 201, """
                {"fullName":"Asha Verma","email":"asha@acme.in","phone":"9811111111","password":"Passw0rd!1",
                 "companyName":"Acme Electricals","city":"Jaipur","state":"Rajasthan"}""");
        employerToken = reg.get("token").asText();
        otherEmployerToken = call(post("/api/auth/register/employer"), null, 201, """
                {"fullName":"Other Owner","email":"other@rival.in","phone":"9822222222","password":"Passw0rd!1",
                 "companyName":"Rival Works","city":"Pune","state":"Maharashtra"}""").get("token").asText();

        // an unapproved employer cannot post jobs
        call(post("/api/employer/jobs"), employerToken, 403, jobJson("[]"));

        JsonNode company = call(get("/api/employer/company"), employerToken, 200, null);
        companyId = company.get("id").asLong();
        assertEquals("PENDING", company.get("status").asText());

        call(post("/api/admin/employers/" + companyId + "/approve"), adminToken, 200, null);
    }

    @Test
    @Order(2)
    void employerPostsJobAndAdminApprovesIt() throws Exception {
        JsonNode meta = call(get("/api/public/meta"), null, 200, null);
        JsonNode skill = meta.get("skills").get(0);
        skillId = skill.get("id").asLong();
        category = skill.get("category").asText();

        JsonNode created = call(post("/api/employer/jobs"), employerToken, 201, jobJson("[" + skillId + "]"));
        jobId = created.get("id").asLong();
        assertEquals("DRAFT", created.get("status").asText());

        // not public until approved
        call(get("/api/public/jobs/" + jobId), null, 404, null);

        call(post("/api/employer/jobs/" + jobId + "/submit"), employerToken, 200, null);
        call(post("/api/admin/jobs/" + jobId + "/approve"), adminToken, 200, null);

        JsonNode search = call(get("/api/public/jobs?keyword=wireman&city=jaipur"), null, 200, null);
        assertEquals(1, search.get("totalItems").asInt());
        call(get("/api/public/jobs/" + jobId), null, 200, null);
    }

    @Test
    @Order(3)
    void candidateRegistersBuildsProfileUploadsResumeAndApplies() throws Exception {
        candidateToken = call(post("/api/auth/register/candidate"), null, 201, """
                {"fullName":"Ravi Meena","email":"ravi@example.com","phone":"9876543210","password":"Passw0rd!1"}""")
                .get("token").asText();
        otherCandidateToken = call(post("/api/auth/register/candidate"), null, 201, """
                {"fullName":"Second Person","email":"second@example.com","phone":"9876543211","password":"Passw0rd!1"}""")
                .get("token").asText();

        // duplicate registration is rejected
        call(post("/api/auth/register/candidate"), null, 409, """
                {"fullName":"Ravi Again","email":"RAVI@example.com","phone":"9876543210","password":"Passw0rd!1"}""");

        JsonNode profile = call(put("/api/candidate/profile"), candidateToken, 200, """
                {"fullName":"Ravi Meena","phone":"9876543210","headline":"Electrician","city":"Jaipur","state":"Rajasthan",
                 "summary":"Six years on site","totalExperienceYears":6,"skillIds":[%d],
                 "education":[{"degree":"ITI Electrician","institution":"Govt ITI","yearOfCompletion":2016}],
                 "experience":[{"jobTitle":"Electrician","companyName":"Balaji","startDate":"2016-06-01","endDate":null,
                                "description":"Wiring"}]}""".formatted(skillId));
        assertTrue(profile.get("completeness").asInt() >= 80);

        MockMultipartFile pdf = new MockMultipartFile("file", "resume.pdf", "application/pdf",
                "%PDF-1.4\n%%EOF\n".getBytes(StandardCharsets.US_ASCII));
        JsonNode resume = callBuilder(multipart("/api/candidate/resume").file(pdf), candidateToken, 201);
        resumeId = resume.get("id").asLong();

        // wrong content is refused even with a .pdf name
        MockMultipartFile fake = new MockMultipartFile("file", "evil.pdf", "application/pdf", "not a pdf".getBytes());
        callBuilder(multipart("/api/candidate/resume").file(fake), candidateToken, 400);

        JsonNode detail = call(get("/api/public/jobs/" + jobId), candidateToken, 200, null);
        assertEquals(false, detail.get("viewer").get("applied").asBoolean());

        JsonNode application = call(post("/api/candidate/jobs/" + jobId + "/apply"), candidateToken, 201,
                "{\"coverNote\":\"Available immediately\"}");
        applicationId = application.get("id").asLong();
        assertEquals("APPLIED", application.get("status").asText());

        call(post("/api/candidate/jobs/" + jobId + "/apply"), candidateToken, 409, "{}");
        call(post("/api/candidate/saved-jobs/" + jobId), candidateToken, 204, null);
    }

    @Test
    @Order(4)
    void employerReviewsAndShortlistsAndCandidateSeesIt() throws Exception {
        JsonNode list = call(get("/api/employer/applications"), employerToken, 200, null);
        assertEquals(1, list.get("totalItems").asInt());
        assertEquals("Ravi Meena", list.get("items").get(0).get("candidateName").asText());

        JsonNode detail = call(get("/api/employer/applications/" + applicationId), employerToken, 200, null);
        assertEquals(resumeId, detail.get("resumeId").asLong());

        // the receiving employer can download the resume; another candidate and another employer cannot
        mvc.perform(get("/api/resumes/" + resumeId + "/download").header("Authorization", "Bearer " + employerToken))
                .andExpect(status().isOk());
        mvc.perform(get("/api/resumes/" + resumeId + "/download").header("Authorization", "Bearer " + otherCandidateToken))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/resumes/" + resumeId + "/download").header("Authorization", "Bearer " + otherEmployerToken))
                .andExpect(status().isNotFound());

        // a rival employer cannot see or decide on this application
        call(get("/api/employer/applications/" + applicationId), otherEmployerToken, 404, null);
        call(patch("/api/employer/applications/" + applicationId + "/status"), otherEmployerToken, 404,
                "{\"status\":\"SHORTLISTED\"}");
        // APPLIED is not a decision
        call(patch("/api/employer/applications/" + applicationId + "/status"), employerToken, 400,
                "{\"status\":\"APPLIED\"}");

        JsonNode decided = call(patch("/api/employer/applications/" + applicationId + "/status"), employerToken, 200,
                "{\"status\":\"SHORTLISTED\"}");
        assertEquals("SHORTLISTED", decided.get("status").asText());

        JsonNode mine = call(get("/api/candidate/applications"), candidateToken, 200, null);
        assertEquals("SHORTLISTED", mine.get(0).get("status").asText());
    }

    @Test
    @Order(5)
    void adminSeesTheWholeWorkflow() throws Exception {
        JsonNode stats = call(get("/api/admin/dashboard"), adminToken, 200, null);
        assertEquals(1, stats.get("totalApplications").asInt());
        assertEquals(1, stats.get("applicationsByStatus").get("SHORTLISTED").asInt());

        JsonNode apps = call(get("/api/admin/applications"), adminToken, 200, null);
        assertEquals(1, apps.get("totalItems").asInt());

        String audit = call(get("/api/admin/audit-logs"), adminToken, 200, null).toString();
        assertTrue(audit.contains("EMPLOYER_APPROVED"));
        assertTrue(audit.contains("JOB_APPROVED"));
        assertTrue(audit.contains("APPLICATION_SHORTLISTED"));

        // deactivating the employer takes their jobs off the public site immediately
        JsonNode employers = call(get("/api/admin/employers?status=APPROVED"), adminToken, 200, null);
        long employerUserId = employers.get("items").get(0).get("ownerId").asLong();
        call(patch("/api/admin/users/" + employerUserId + "/active"), adminToken, 200, "{\"active\":false}");
        call(get("/api/public/jobs/" + jobId), null, 404, null);
        call(post("/api/auth/login"), null, 403, "{\"email\":\"asha@acme.in\",\"password\":\"Passw0rd!1\"}");
    }

    @Test
    @Order(6)
    void rbacIsEnforcedOnTheServer() throws Exception {
        call(get("/api/candidate/profile"), null, 401, null);
        call(get("/api/employer/company"), candidateToken, 403, null);
        call(get("/api/admin/dashboard"), candidateToken, 403, null);
        call(get("/api/admin/dashboard"), employerToken, 401, null);   // deactivated in the previous step
        call(get("/api/candidate/applications"), adminToken, 403, null);
    }

    // ------------------------------------------------------------------ helpers

    private String login(String email, String password) throws Exception {
        return call(post("/api/auth/login"), null, 200,
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}").get("token").asText();
    }

    private JsonNode call(MockHttpServletRequestBuilder builder, String token, int expectedStatus, String body)
            throws Exception {
        if (body != null) {
            builder.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return callBuilder(builder, token, expectedStatus);
    }

    private JsonNode callBuilder(MockHttpServletRequestBuilder builder, String token, int expectedStatus)
            throws Exception {
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        String response = mvc.perform(builder)
                .andExpect(status().is(expectedStatus))
                .andReturn().getResponse().getContentAsString();
        return response.isBlank() ? json.createObjectNode() : json.readTree(response);
    }

    private String jobJson(String skillIds) {
        return """
                {"title":"Wireman for housing project","description":"Wiring, MCB fitting and testing for a residential project.",
                 "category":"%s","city":"Jaipur","state":"Rajasthan","jobType":"FULL_TIME","salaryMin":18000,
                 "salaryMax":24000,"minExperienceYears":2,"openings":3,"skillIds":%s}"""
                .formatted(category == null ? "Electrical & Electronics" : category, skillIds);
    }
}
