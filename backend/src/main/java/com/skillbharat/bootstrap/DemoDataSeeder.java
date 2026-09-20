package com.skillbharat.bootstrap;

import com.skillbharat.domain.Application;
import com.skillbharat.domain.ApplicationStatus;
import com.skillbharat.domain.CandidateProfile;
import com.skillbharat.domain.Company;
import com.skillbharat.domain.CompanyStatus;
import com.skillbharat.domain.Education;
import com.skillbharat.domain.Experience;
import com.skillbharat.domain.Job;
import com.skillbharat.domain.JobStatus;
import com.skillbharat.domain.JobType;
import com.skillbharat.domain.Resume;
import com.skillbharat.domain.Role;
import com.skillbharat.domain.SavedJob;
import com.skillbharat.domain.Skill;
import com.skillbharat.domain.User;
import com.skillbharat.repository.ApplicationRepository;
import com.skillbharat.repository.AuditLogRepository;
import com.skillbharat.repository.CandidateProfileRepository;
import com.skillbharat.repository.CompanyRepository;
import com.skillbharat.repository.JobRepository;
import com.skillbharat.repository.ResumeRepository;
import com.skillbharat.repository.SavedJobRepository;
import com.skillbharat.repository.SkillRepository;
import com.skillbharat.repository.UserRepository;
import com.skillbharat.domain.AuditLog;
import com.skillbharat.storage.FileStorage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Loads realistic demo data (candidates, employers, jobs, applications) on first start when
 * SEED_DEMO_DATA=true. Passwords are hashed at runtime. Safe to run repeatedly: it does nothing
 * once the demo admin exists. Disable in production with SEED_DEMO_DATA=false.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String ADMIN_EMAIL = "admin@skillbharat.in";
    public static final String ADMIN_PASSWORD = "Admin@1234";
    public static final String DEMO_PASSWORD = "Demo@1234";

    private final UserRepository users;
    private final CandidateProfileRepository profiles;
    private final CompanyRepository companies;
    private final JobRepository jobs;
    private final ApplicationRepository applications;
    private final SavedJobRepository savedJobs;
    private final ResumeRepository resumes;
    private final SkillRepository skillRepository;
    private final AuditLogRepository auditLogs;
    private final PasswordEncoder encoder;
    private final FileStorage storage;

    private final Map<String, Skill> skillsByName = new HashMap<>();
    private final Map<String, Job> jobsByTitle = new HashMap<>();

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.existsByEmailIgnoreCase(ADMIN_EMAIL)) {
            log.info("Demo data already present; skipping seed");
            return;
        }
        skillRepository.findAll().forEach(s -> skillsByName.put(s.getName(), s));

        User admin = user("Platform Admin", ADMIN_EMAIL, "9800000000", ADMIN_PASSWORD, Role.ADMIN, 60);

        Company electricals = company("Anita Rathore", "hr@rajasthanelectricals.in", "9829000001",
                "Rajasthan Electricals Pvt Ltd", "Electrical Contracting", "Jaipur", "Rajasthan",
                "Electrical contractor for homes, malls and solar rooftops across Rajasthan. 120 technicians on payroll.",
                CompanyStatus.APPROVED, 45);
        Company capital = company("Vikram Malhotra", "hiring@capitalbuild.in", "9810000002",
                "CapitalBuild Infra", "Construction & Infrastructure", "Delhi", "Delhi",
                "Residential and commercial builder active in Delhi NCR and Mumbai. Timely wages, PF and site insurance.",
                CompanyStatus.APPROVED, 40);
        Company auto = company("Shwetha Rao", "careers@nammaauto.in", "9880000003",
                "Namma Auto Services", "Automobile Service", "Bengaluru", "Karnataka",
                "Multi-brand two-wheeler and car service network with 14 workshops in Bengaluru.",
                CompanyStatus.APPROVED, 35);
        Company tooling = company("Rahul Deshmukh", "jobs@punetooling.in", "9822000004",
                "Pune Precision Tooling", "Manufacturing", "Pune", "Maharashtra",
                "Precision machining supplier to automotive OEMs in Chakan and Pimpri-Chinchwad.",
                CompanyStatus.APPROVED, 30);
        Company meridian = company("Neha Kulkarni", "ops@meridianfacility.in", "9820000005",
                "Meridian Facility & Logistics", "Logistics & Facility Services", "Mumbai", "Maharashtra",
                "Warehousing, transport and on-site facility services for corporate clients.",
                CompanyStatus.APPROVED, 28);
        company("Farhan Shaikh", "contact@konkanfab.in", "9821000006",
                "Konkan Fab Works", "Fabrication", "Mumbai", "Maharashtra",
                "Structural steel fabrication workshop in Navi Mumbai. Awaiting verification.",
                CompanyStatus.PENDING, 2);

        // ---- jobs (APPROVED unless noted)
        job(electricals, "Electrician for Residential & Commercial Sites", "Electrical & Electronics", "Jaipur", "Rajasthan",
                JobType.FULL_TIME, 18000, 26000, 2, 6, JobStatus.APPROVED, 3,
                "Install and maintain wiring, MCBs and distribution boards at apartment and commercial projects in Jaipur. "
                        + "ITI or equivalent experience required. Own basic tools preferred; safety gear is provided.",
                "Domestic Wiring", "Panel Board Assembly");
        job(electricals, "Solar Rooftop Installation Technician", "Electrical & Electronics", "Jaipur", "Rajasthan",
                JobType.FULL_TIME, 20000, 30000, 1, 4, JobStatus.APPROVED, 6,
                "Mount panels, run DC/AC cabling and commission on-grid rooftop systems for homes and factories. "
                        + "Work at height with harness training provided. Travel within Rajasthan paid.",
                "Solar PV Installation", "Domestic Wiring");
        job(electricals, "Industrial Electrician (Plant Maintenance)", "Electrical & Electronics", "Delhi", "Delhi",
                JobType.CONTRACT, 24000, 34000, 4, 3, JobStatus.APPROVED, 8,
                "12-month contract for preventive maintenance of motors, MCCs and control panels at a manufacturing plant in Delhi NCR. "
                        + "Rotational shifts; overtime paid.",
                "Industrial Wiring", "Motor Winding");
        job(electricals, "AC Installation & Repair Technician", "HVAC & Refrigeration", "Jaipur", "Rajasthan",
                JobType.FULL_TIME, 17000, 24000, 1, 3, JobStatus.DRAFT, 1,
                "Install, service and repair split and window ACs for residential customers. Two-wheeler and licence required.",
                "AC Installation & Repair");

        job(capital, "Mason (Rajmistri)", "Construction & Civil", "Delhi", "Delhi",
                JobType.FULL_TIME, 16000, 22000, 3, 10, JobStatus.APPROVED, 4,
                "Brickwork, plastering and block work on a residential tower in Dwarka. Weekly attendance-based payment, "
                        + "PF and accident insurance provided.",
                "Masonry");
        job(capital, "Tile & Marble Fitter", "Construction & Civil", "Delhi", "Delhi",
                JobType.FULL_TIME, 18000, 25000, 2, 5, JobStatus.APPROVED, 5,
                "Floor and wall tile laying, marble polishing and grouting for premium apartments. Piece-rate bonus above target.",
                "Tile & Marble Fitting", "Painting & Finishing");
        job(capital, "Site Supervisor (Civil)", "Construction & Civil", "Mumbai", "Maharashtra",
                JobType.FULL_TIME, 30000, 42000, 6, 2, JobStatus.APPROVED, 9,
                "Supervise 40-60 workers, track material and daily progress, and coordinate with the project engineer at a Thane site. "
                        + "Diploma in civil preferred.",
                "Site Supervision", "Shuttering & Bar Bending");

        job(auto, "Two-Wheeler Mechanic", "Automotive & Mechanic", "Bengaluru", "Karnataka",
                JobType.FULL_TIME, 15000, 22000, 1, 5, JobStatus.APPROVED, 2,
                "Service and repair motorcycles and scooters at our Indiranagar and Whitefield workshops. Incentive on every job card closed.",
                "Two-Wheeler Mechanic", "Wheel Alignment");
        job(auto, "Auto Electrician", "Automotive & Mechanic", "Bengaluru", "Karnataka",
                JobType.FULL_TIME, 20000, 28000, 3, 2, JobStatus.APPROVED, 7,
                "Diagnose wiring, ECU and battery faults on cars and two-wheelers using scan tools. Experience with EV wiring is a plus.",
                "Auto Electrician", "Four-Wheeler Mechanic");
        job(auto, "Denting & Painting Technician", "Automotive & Mechanic", "Bengaluru", "Karnataka",
                JobType.FULL_TIME, 19000, 27000, 2, 3, JobStatus.PENDING_APPROVAL, 1,
                "Panel beating, putty, spray painting and finishing in our body shop. Experience with 2K paints preferred.",
                "Denting & Painting");

        job(tooling, "CNC Operator (Fanuc)", "CNC & Machine Operation", "Pune", "Maharashtra",
                JobType.FULL_TIME, 20000, 30000, 2, 8, JobStatus.APPROVED, 2,
                "Operate Fanuc CNC turning centres, set offsets and inspect parts with vernier and micrometer. "
                        + "Two shifts, canteen and bus facility from Pimpri.",
                "CNC Operator", "Lathe Machine Operator");
        job(tooling, "VMC Operator", "CNC & Machine Operation", "Pune", "Maharashtra",
                JobType.FULL_TIME, 22000, 32000, 3, 4, JobStatus.APPROVED, 10,
                "Set up and run VMC machines for automotive components. Able to read drawings and make tool offsets independently.",
                "VMC Operator", "Quality Inspection");
        job(tooling, "Quality Inspector (Machine Shop)", "CNC & Machine Operation", "Pune", "Maharashtra",
                JobType.FULL_TIME, 18000, 26000, 2, 2, JobStatus.PENDING_APPROVAL, 1,
                "First-piece and in-process inspection of machined components using gauges and CMM reports.",
                "Quality Inspection");
        Job welder = job(tooling, "Welder (MIG/TIG)", "Welding & Fabrication", "Pune", "Maharashtra",
                JobType.FULL_TIME, 21000, 30000, 3, 4, JobStatus.REJECTED, 12,
                "Weld fixtures and sheet metal assemblies to drawing. Certified welders preferred.",
                "MIG Welding", "TIG Welding");
        welder.setRejectionReason("Please mention working hours and whether overtime is paid, then resubmit.");

        job(meridian, "Heavy Vehicle Driver (HMV)", "Driving & Logistics", "Mumbai", "Maharashtra",
                JobType.FULL_TIME, 25000, 35000, 4, 6, JobStatus.APPROVED, 3,
                "Drive 32-ft multi-axle trucks on Mumbai-Pune and Mumbai-Ahmedabad routes. Valid HMV licence and clean record required. "
                        + "Trip allowance and insurance included.",
                "Heavy Vehicle Driver");
        job(meridian, "Forklift Operator", "Driving & Logistics", "Mumbai", "Maharashtra",
                JobType.FULL_TIME, 18000, 24000, 1, 4, JobStatus.APPROVED, 6,
                "Load, unload and stack pallets at a Bhiwandi warehouse. Forklift licence or certificate preferred; training available.",
                "Forklift Operator", "Warehouse Associate");
        job(meridian, "Security Guard (Ex-Servicemen Preferred)", "Security & Facility", "Delhi", "Delhi",
                JobType.FULL_TIME, 16000, 20000, 0, 12, JobStatus.APPROVED, 5,
                "Access control and patrolling at corporate offices in Gurugram and Delhi. Uniform provided; 8-hour shifts, weekly off.",
                "Security Guard");
        job(meridian, "Commis Chef (Corporate Canteen)", "Hospitality & Kitchen", "Bengaluru", "Karnataka",
                JobType.FULL_TIME, 15000, 21000, 1, 3, JobStatus.APPROVED, 4,
                "Prepare North and South Indian meals for 400 employees. Day shift only, Sundays off, free meals during duty.",
                "Commis Chef", "Kitchen Helper");

        // ---- candidates
        CandidateProfile ravi = candidate("Ravi Meena", "ravi.meena@example.com", "9876500001", "Jaipur", "Rajasthan",
                "Licensed electrician with 6 years on residential, commercial and rooftop solar sites", 6,
                "Comfortable working at height and reading single-line diagrams. Looking for a stable role with site safety practices.",
                new String[]{"Domestic Wiring", "Industrial Wiring", "Panel Board Assembly", "Solar PV Installation"},
                new Object[]{"ITI Electrician", "Government ITI, Jaipur", 2016},
                new Object[][]{
                        {"Senior Electrician", "Sunrise Solar Pvt Ltd", LocalDate.of(2020, 3, 1), null,
                                "Led a 5-member crew on 40+ rooftop solar installs."},
                        {"Electrician", "Shree Balaji Electricals", LocalDate.of(2016, 6, 1), LocalDate.of(2020, 2, 1),
                                "House wiring and panel work for residential projects."}},
                true, 50);
        CandidateProfile kavita = candidate("Kavita Sharma", "kavita.sharma@example.com", "9876500006", "Jaipur", "Rajasthan",
                "Fresher electrician, ITI 2025", 0,
                "Recently completed ITI and a 6-month apprenticeship. Eager to learn on live sites.",
                new String[]{"Domestic Wiring"},
                new Object[]{"ITI Electrician", "Women's ITI, Jaipur", 2025},
                new Object[][]{{"Apprentice Electrician", "Pink City Electricals", LocalDate.of(2025, 4, 1),
                        LocalDate.of(2025, 9, 30), "Assisted with residential wiring and DB installation."}},
                false, 20);
        CandidateProfile imran = candidate("Imran Qureshi", "imran.qureshi@example.com", "9876500002", "Delhi", "Delhi",
                "Mason and tile fitter, 9 years, high-rise finishing", 9,
                "Experienced with vitrified tiles, marble and granite. Can lead a small crew.",
                new String[]{"Masonry", "Tile & Marble Fitting", "Painting & Finishing"},
                new Object[]{"Skill certificate in Masonry (PMKVY)", "NSDC Training Centre, Delhi", 2015},
                new Object[][]{{"Tile Fitter", "Om Sai Constructions", LocalDate.of(2015, 8, 1), null,
                        "Tile and marble work in apartments across South Delhi and Noida."}},
                true, 45);
        CandidateProfile arjun = candidate("Arjun Gowda", "arjun.gowda@example.com", "9876500003", "Bengaluru", "Karnataka",
                "Two-wheeler mechanic and auto electrician, 5 years", 5,
                "Strong in fuel injection diagnostics and wiring faults on Honda, Bajaj and TVS.",
                new String[]{"Two-Wheeler Mechanic", "Auto Electrician", "Wheel Alignment"},
                new Object[]{"ITI Motor Mechanic Vehicle", "Government ITI, Tumakuru", 2019},
                new Object[][]{{"Mechanic", "Speedwell Motors", LocalDate.of(2019, 7, 1), null,
                        "Service and repair of 60+ two-wheelers a month."}},
                true, 40);
        CandidateProfile pooja = candidate("Pooja Patil", "pooja.patil@example.com", "9876500004", "Pune", "Maharashtra",
                "CNC operator, 4 years in automotive machining", 4,
                "Fanuc and Siemens controls, offset correction, in-process inspection.",
                new String[]{"CNC Operator", "VMC Operator", "Lathe Machine Operator", "Quality Inspection"},
                new Object[]{"Diploma in Mechanical Engineering", "Government Polytechnic, Pune", 2021},
                new Object[][]{{"CNC Operator", "Bhosari Engineering Works", LocalDate.of(2021, 8, 1), null,
                        "Ran 2 CNC lathes on a two-shift pattern for Tier-2 automotive parts."}},
                true, 35);
        CandidateProfile sandeep = candidate("Sandeep Yadav", "sandeep.yadav@example.com", "9876500005", "Mumbai", "Maharashtra",
                "HMV driver and forklift operator, 8 years", 8,
                "Valid HMV licence, no accidents. Long-haul and warehouse experience.",
                new String[]{"Heavy Vehicle Driver", "Forklift Operator", "Warehouse Associate"},
                new Object[]{"10th Pass", "Maharashtra State Board", 2012},
                new Object[][]{{"Truck Driver", "Western Roadlines", LocalDate.of(2016, 1, 1), null,
                        "Mumbai to Gujarat and Rajasthan freight routes."}},
                true, 30);

        // ---- applications
        apply(ravi, "Electrician for Residential & Commercial Sites", ApplicationStatus.SHORTLISTED, 5,
                "I have worked on similar sites for 6 years and can join within 2 weeks.");
        apply(ravi, "Solar Rooftop Installation Technician", ApplicationStatus.APPLIED, 4, null);
        apply(ravi, "Industrial Electrician (Plant Maintenance)", ApplicationStatus.APPLIED, 3, null);
        apply(kavita, "Electrician for Residential & Commercial Sites", ApplicationStatus.APPLIED, 2,
                "Fresh ITI graduate, happy to start as a helper and grow.");
        apply(kavita, "Solar Rooftop Installation Technician", ApplicationStatus.REJECTED, 4, null);
        apply(imran, "Mason (Rajmistri)", ApplicationStatus.SHORTLISTED, 3, "Can bring two helpers along.");
        apply(imran, "Tile & Marble Fitter", ApplicationStatus.APPLIED, 2, null);
        apply(arjun, "Two-Wheeler Mechanic", ApplicationStatus.APPLIED, 1, null);
        apply(arjun, "Auto Electrician", ApplicationStatus.SHORTLISTED, 4, "Comfortable with scan tools and EV wiring basics.");
        apply(pooja, "CNC Operator (Fanuc)", ApplicationStatus.APPLIED, 1, null);
        apply(pooja, "VMC Operator", ApplicationStatus.APPLIED, 1, "Working on Fanuc 0i; ready to move to VMC.");
        apply(sandeep, "Heavy Vehicle Driver (HMV)", ApplicationStatus.APPLIED, 2, null);
        apply(sandeep, "Forklift Operator", ApplicationStatus.REJECTED, 5, null);

        // ---- saved jobs
        save(ravi, "Site Supervisor (Civil)");
        save(kavita, "Two-Wheeler Mechanic");
        save(arjun, "Commis Chef (Corporate Canteen)");

        // ---- audit trail so the admin log is not empty on first login
        audit(admin, "EMPLOYER_APPROVED", "COMPANY", "Rajasthan Electricals Pvt Ltd", 44);
        audit(admin, "EMPLOYER_APPROVED", "COMPANY", "CapitalBuild Infra", 39);
        audit(admin, "JOB_APPROVED", "JOB", "Electrician for Residential & Commercial Sites", 3);
        audit(admin, "JOB_REJECTED", "JOB", "Welder (MIG/TIG): Please mention working hours...", 11);

        log.info("Demo data loaded. Admin: {} / {}   Others: <email> / {}", ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_PASSWORD);
    }

    // ------------------------------------------------------------------ builders

    private User user(String name, String email, String phone, String password, Role role, int daysAgo) {
        User u = new User();
        u.setFullName(name);
        u.setEmail(email);
        u.setPhone(phone);
        u.setPasswordHash(encoder.encode(password));
        u.setRole(role);
        u.setCreatedAt(ago(daysAgo));
        return users.save(u);
    }

    private Company company(String ownerName, String email, String phone, String name, String industry, String city,
                            String state, String description, CompanyStatus status, int daysAgo) {
        User owner = user(ownerName, email, phone, DEMO_PASSWORD, Role.EMPLOYER, daysAgo);
        Company c = new Company();
        c.setOwner(owner);
        c.setName(name);
        c.setIndustry(industry);
        c.setCity(city);
        c.setState(state);
        c.setDescription(description);
        c.setStatus(status);
        c.setCreatedAt(ago(daysAgo));
        if (status != CompanyStatus.PENDING) {
            c.setReviewedAt(ago(Math.max(daysAgo - 1, 0)));
        }
        return companies.save(c);
    }

    private Job job(Company company, String title, String category, String city, String state, JobType type,
                    int salaryMin, int salaryMax, int minExperience, int openings, JobStatus status, int daysAgo,
                    String description, String... skillNames) {
        Job j = new Job();
        j.setCompany(company);
        j.setTitle(title);
        j.setCategory(category);
        j.setCity(city);
        j.setState(state);
        j.setJobType(type);
        j.setSalaryMin(salaryMin);
        j.setSalaryMax(salaryMax);
        j.setMinExperienceYears(minExperience);
        j.setOpenings(openings);
        j.setDescription(description);
        j.setStatus(status);
        j.setCreatedAt(ago(daysAgo + 1));
        j.setUpdatedAt(ago(daysAgo));
        if (status == JobStatus.APPROVED) {
            j.setPostedAt(ago(daysAgo));
        }
        for (String name : skillNames) {
            j.getSkills().add(skill(name));
        }
        Job saved = jobs.save(j);
        jobsByTitle.put(title, saved);
        return saved;
    }

    private CandidateProfile candidate(String name, String email, String phone, String city, String state,
                                       String headline, int experienceYears, String summary, String[] skillNames,
                                       Object[] education, Object[][] experience, boolean withResume, int daysAgo) {
        User u = user(name, email, phone, DEMO_PASSWORD, Role.JOB_SEEKER, daysAgo);
        CandidateProfile p = new CandidateProfile();
        p.setUser(u);
        p.setCity(city);
        p.setState(state);
        p.setHeadline(headline);
        p.setTotalExperienceYears(experienceYears);
        p.setSummary(summary);
        for (String s : skillNames) {
            p.getSkills().add(skill(s));
        }
        Education e = new Education();
        e.setProfile(p);
        e.setDegree((String) education[0]);
        e.setInstitution((String) education[1]);
        e.setYearOfCompletion((Integer) education[2]);
        p.getEducation().add(e);
        for (Object[] row : experience) {
            Experience x = new Experience();
            x.setProfile(p);
            x.setJobTitle((String) row[0]);
            x.setCompanyName((String) row[1]);
            x.setStartDate((LocalDate) row[2]);
            x.setEndDate((LocalDate) row[3]);
            x.setDescription((String) row[4]);
            p.getExperience().add(x);
        }
        p.setCreatedAt(ago(daysAgo));
        CandidateProfile saved = profiles.save(p);
        if (withResume) {
            attachResume(saved, name, headline, summary, skillNames);
        }
        return saved;
    }

    private void apply(CandidateProfile candidate, String jobTitle, ApplicationStatus status, int daysAgo, String note) {
        Application a = new Application();
        a.setJob(jobsByTitle.get(jobTitle));
        a.setCandidate(candidate);
        a.setResume(resumes.findFirstByProfileIdOrderByUploadedAtDesc(candidate.getId()).orElse(null));
        a.setCoverNote(note);
        a.setStatus(status);
        a.setAppliedAt(ago(daysAgo));
        a.setUpdatedAt(status == ApplicationStatus.APPLIED ? ago(daysAgo) : ago(Math.max(daysAgo - 1, 0)));
        applications.save(a);
    }

    private void save(CandidateProfile candidate, String jobTitle) {
        SavedJob s = new SavedJob();
        s.setCandidate(candidate);
        s.setJob(jobsByTitle.get(jobTitle));
        savedJobs.save(s);
    }

    private void audit(User actor, String action, String entityType, String details, int daysAgo) {
        AuditLog entry = new AuditLog();
        entry.setActorId(actor.getId());
        entry.setActorEmail(actor.getEmail());
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setDetails(details);
        entry.setCreatedAt(ago(daysAgo));
        auditLogs.save(entry);
    }

    private Skill skill(String name) {
        Skill s = skillsByName.get(name);
        if (s == null) {
            throw new IllegalStateException("Seed data references unknown skill: " + name);
        }
        return s;
    }

    private static Instant ago(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
    }

    // ------------------------------------------------------------------ demo resume files

    private void attachResume(CandidateProfile profile, String name, String headline, String summary, String[] skills) {
        List<String> lines = new ArrayList<>();
        lines.add(headline);
        lines.add(profile.getCity() + ", " + profile.getState());
        lines.add("");
        lines.add("Summary");
        lines.add(summary);
        lines.add("");
        lines.add("Skills: " + String.join(", ", skills));
        lines.add("");
        lines.add("(Demo resume generated by the SkillBharat seed data)");
        byte[] pdf = minimalPdf(name, lines);

        String key = UUID.randomUUID() + ".pdf";
        try {
            storage.store(key, new ByteArrayInputStream(pdf));
        } catch (IOException e) {
            throw new IllegalStateException("Could not write demo resume", e);
        }
        Resume r = new Resume();
        r.setProfile(profile);
        r.setOriginalFilename(name.replace(' ', '_') + "_Resume.pdf");
        r.setStorageKey(key);
        r.setContentType("application/pdf");
        r.setSizeBytes(pdf.length);
        r.setUploadedAt(Instant.now().minus(20, ChronoUnit.DAYS));
        resumes.save(r);
    }

    /** A tiny, valid single-page PDF (ASCII only) so "View resume" works out of the box in the demo. */
    static byte[] minimalPdf(String title, List<String> lines) {
        StringBuilder content = new StringBuilder();
        content.append("BT /F1 20 Tf 50 790 Td (").append(escape(title)).append(") Tj ET\n");
        int y = 760;
        for (String line : lines) {
            content.append("BT /F1 11 Tf 50 ").append(y).append(" Td (").append(escape(line)).append(") Tj ET\n");
            y -= 18;
        }
        String stream = content.toString();
        List<String> objects = List.of(
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
                        + "/Resources << /Font << /F1 5 0 R >> >> >>",
                "<< /Length " + stream.length() + " >>\nstream\n" + stream + "endstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        List<Integer> offsets = new ArrayList<>();
        for (int i = 0; i < objects.size(); i++) {
            offsets.add(pdf.length());
            pdf.append(i + 1).append(" 0 obj\n").append(objects.get(i)).append("\nendobj\n");
        }
        int xref = pdf.length();
        pdf.append("xref\n0 ").append(objects.size() + 1).append("\n0000000000 65535 f \n");
        for (int offset : offsets) {
            pdf.append(String.format(Locale.ROOT, "%010d 00000 n \n", offset));
        }
        pdf.append("trailer\n<< /Size ").append(objects.size() + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref).append("\n%%EOF\n");
        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private static String escape(String text) {
        StringBuilder sb = new StringBuilder();
        for (char c : text.toCharArray()) {
            if (c == '(' || c == ')' || c == '\\') {
                sb.append('\\').append(c);
            } else if (c < 32 || c > 126) {
                sb.append('?');
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }
}
