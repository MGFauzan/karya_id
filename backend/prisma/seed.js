/**
 * KARYA.ID — Database Seed
 * Comprehensive dummy data for development & demo
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding KARYA.ID database...\n')

  // ── CLEANUP ─────────────────────────────────────────────────────────────
  await prisma.recommendation.deleteMany()
  await prisma.application.deleteMany()
  await prisma.skillGap.deleteMany()
  await prisma.training.deleteMany()
  await prisma.job.deleteMany()
  await prisma.company.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.user.deleteMany()

  const hashPw = (pw) => bcrypt.hashSync(pw, 10)

  // ── ADMIN USER ───────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: 'admin@karya.id',
      password: hashPw('admin123'),
      name: 'Admin KARYA.ID',
      role: 'ADMIN',
      segment: 'UMUM',
      isVerified: true,
      profile: {
        create: {
          phone: '081200000000',
          bio: 'Platform administrator',
          province: 'DKI Jakarta',
          city: 'Jakarta Pusat',
          skills: ['administration', 'platform management'],
        }
      }
    }
  })

  // ── COMPANY USERS ────────────────────────────────────────────────────────
  const companyUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'hr@tokopedia.id',
        password: hashPw('company123'),
        name: 'HR Tokopedia',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Tokopedia Indonesia',
            description: 'Platform e-commerce terkemuka di Indonesia yang berkomitmen pada inklusivitas kerja',
            industry: 'Technology',
            size: '1000+',
            website: 'https://tokopedia.com',
            province: 'DKI Jakarta',
            city: 'Jakarta Selatan',
            address: 'Jl. Prof. Dr. Satrio No.164, Kuningan',
            latitude: -6.2297,
            longitude: 106.8294,
            isInclusiveEmployer: true,
            difabelQuota: 20,
            isVerified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'hr@gojek.id',
        password: hashPw('company123'),
        name: 'HR Gojek',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Gojek Indonesia',
            description: 'Super-app teknologi yang memberdayakan driver, UMKM, dan talenta digital Indonesia',
            industry: 'Technology',
            size: '5000+',
            website: 'https://gojek.com',
            province: 'DKI Jakarta',
            city: 'Jakarta Selatan',
            address: 'Pasaraya Blok M, Gedung B lt. 6',
            latitude: -6.2441,
            longitude: 106.7969,
            isInclusiveEmployer: true,
            difabelQuota: 15,
            isVerified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'hr@pertamina.id',
        password: hashPw('company123'),
        name: 'HR Pertamina',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Pertamina (Persero)',
            description: 'BUMN energi nasional yang membuka peluang bagi talenta lokal dari seluruh penjuru Indonesia',
            industry: 'Energy',
            size: '30000+',
            website: 'https://pertamina.com',
            province: 'DKI Jakarta',
            city: 'Jakarta Pusat',
            address: 'Jl. Medan Merdeka Timur No.1A',
            latitude: -6.1876,
            longitude: 106.8314,
            isInclusiveEmployer: true,
            difabelQuota: 50,
            isVerified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'hr@bukalapak.id',
        password: hashPw('company123'),
        name: 'HR Bukalapak',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Bukalapak.com Tbk',
            description: 'Platform marketplace yang berfokus pada pemberdayaan UMKM dan mitra lokal Indonesia',
            industry: 'E-Commerce',
            size: '2000+',
            website: 'https://bukalapak.com',
            province: 'DKI Jakarta',
            city: 'Jakarta Selatan',
            address: 'Jl. Raya Kemang No.8',
            latitude: -6.2607,
            longitude: 106.8160,
            isInclusiveEmployer: false,
            isVerified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'hr@unilever.id',
        password: hashPw('company123'),
        name: 'HR Unilever Indonesia',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Unilever Indonesia Tbk',
            description: 'Perusahaan FMCG global yang aktif merekrut lulusan SMK dan program vokasi',
            industry: 'FMCG',
            size: '5000+',
            website: 'https://unilever.co.id',
            province: 'Banten',
            city: 'Tangerang',
            address: 'Jl. Jend. Gatot Subroto No.151',
            latitude: -6.2154,
            longitude: 106.6437,
            isInclusiveEmployer: true,
            difabelQuota: 30,
            isVerified: true,
          }
        }
      }
    }),
    prisma.user.create({
      data: {
        email: 'hr@sayurmayur.id',
        password: hashPw('company123'),
        name: 'HR Sayur Mayur',
        role: 'COMPANY',
        isVerified: true,
        company: {
          create: {
            name: 'PT Sayur Mayur Agritech',
            description: 'Startup agritech yang menghubungkan petani muda dengan teknologi pertanian modern',
            industry: 'Agriculture',
            size: '51-200',
            website: 'https://sayurmayur.id',
            province: 'Jawa Barat',
            city: 'Bandung',
            address: 'Jl. Rancaekek KM 25',
            latitude: -6.9590,
            longitude: 107.7470,
            isInclusiveEmployer: true,
            isVerified: true,
          }
        }
      }
    }),
  ])

  const companies = await prisma.company.findMany()
  const companyMap = {}
  for (const c of companies) companyMap[c.name] = c

  // ── JOBS ─────────────────────────────────────────────────────────────────
  const jobsData = [
    // TECH JOBS
    {
      companyName: 'PT Tokopedia Indonesia',
      data: {
        title: 'Frontend Developer (React.js)',
        description: 'Kami mencari Frontend Developer berbakat untuk bergabung dalam tim produk Tokopedia. Akan mengerjakan fitur-fitur yang digunakan jutaan pengguna setiap hari.',
        requirements: ['Pengalaman min. 1 tahun React.js', 'Memahami HTML, CSS, JavaScript ES6+', 'Familiar dengan Git & RESTful API', 'Mampu bekerja dalam tim agile'],
        benefits: ['Gaji kompetitif', 'BPJS Kesehatan & Ketenagakerjaan', 'Work from home hybrid', 'Laptop & equipment', 'Training & development budget'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Technology',
        salaryMin: 8000000,
        salaryMax: 15000000,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        isRemote: true,
        latitude: -6.2297,
        longitude: 106.8294,
        requiredSkills: ['react', 'javascript', 'html', 'css', 'git'],
        preferredSegments: ['SMK', 'UMUM'],
        educationMin: 'SMK',
        experienceMin: 1,
        openForDifabel: false,
      }
    },
    {
      companyName: 'PT Tokopedia Indonesia',
      data: {
        title: 'Customer Service Associate',
        description: 'Bergabunglah sebagai Customer Service Associate Tokopedia! Posisi ini terbuka untuk lulusan SMK yang komunikatif dan memiliki semangat melayani pelanggan.',
        requirements: ['Lulusan SMK/SMA sederajat', 'Komunikatif dan ramah', 'Mampu mengetik minimal 40 WPM', 'Bersedia bekerja shift'],
        benefits: ['Gaji UMR + tunjangan', 'BPJS', 'Bonus kinerja', 'Career path jelas'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Customer Service',
        salaryMin: 4500000,
        salaryMax: 6000000,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        isRemote: false,
        latitude: -6.2297,
        longitude: 106.8294,
        requiredSkills: ['komunikasi', 'customer service', 'komputer'],
        preferredSegments: ['SMK', 'DIFABEL'],
        educationMin: 'SMK',
        experienceMin: 0,
        openForDifabel: true,
        difabelTypes: ['tuna rungu', 'fisik'],
      }
    },
    // GOJEK JOBS
    {
      companyName: 'PT Gojek Indonesia',
      data: {
        title: 'Software Engineer - Android',
        description: 'Join Gojek Engineering team! Kembangkan fitur app Gojek yang dipakai 30+ juta pengguna. Kami welcome lulusan SMK berbakat yang ingin grow.',
        requirements: ['Menguasai Kotlin/Java Android', 'Memahami OOP dan design patterns', 'Pengalaman deploy ke Google Play Store', 'Familiar dengan Agile/Scrum'],
        benefits: ['Gaji top market', 'Equity/ESOP', 'Remote-first culture', 'Health insurance premium', 'Annual trip'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Technology',
        salaryMin: 12000000,
        salaryMax: 25000000,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        isRemote: true,
        latitude: -6.2441,
        longitude: 106.7969,
        requiredSkills: ['kotlin', 'android', 'java', 'mobile development'],
        preferredSegments: ['SMK', 'UMUM'],
        educationMin: 'SMK',
        experienceMin: 2,
        openForDifabel: true,
        difabelTypes: ['fisik', 'tuna netra dengan asistif teknologi'],
      }
    },
    {
      companyName: 'PT Gojek Indonesia',
      data: {
        title: 'Merchant Partnership Executive',
        description: 'Bantu UMKM bergabung ke ekosistem GoBiz! Posisi ideal untuk yang berpengalaman di agribisnis atau memiliki network dengan komunitas petani/UMKM.',
        requirements: ['Pengalaman sales/BD min. 1 tahun', 'Memiliki kendaraan', 'Familiar dengan komunitas UMKM lokal', 'Komunikatif dan target-oriented'],
        benefits: ['Gaji pokok + komisi tidak terbatas', 'BPJS', 'Motor operasional', 'Pulsa & BBM'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Sales & Business Development',
        salaryMin: 5000000,
        salaryMax: 12000000,
        province: 'Jawa Barat',
        city: 'Bandung',
        isRemote: false,
        latitude: -6.9175,
        longitude: 107.6191,
        requiredSkills: ['sales', 'komunikasi', 'networking', 'agribisnis'],
        preferredSegments: ['PETANI', 'TKI', 'UMUM'],
        educationMin: 'SMK',
        experienceMin: 1,
        openForDifabel: false,
      }
    },
    // PERTAMINA JOBS
    {
      companyName: 'PT Pertamina (Persero)',
      data: {
        title: 'Teknisi Kilang Minyak (Lulusan SMK)',
        description: 'Program rekrutmen khusus lulusan SMK Teknik untuk menjadi Teknisi Kilang di seluruh fasilitas Pertamina Indonesia. Dapatkan pelatihan intensif dan karir jangka panjang.',
        requirements: ['Lulusan SMK Teknik (Mesin/Listrik/Instrumentasi)', 'IPK/NEM minimal 75', 'Sehat jasmani dan rohani', 'Bersedia ditempatkan di seluruh Indonesia'],
        benefits: ['Gaji + tunjangan lapangan', 'Rumah dinas', 'Asuransi jiwa premium', 'Pension plan', 'Career path s/d level manajer'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Engineering',
        salaryMin: 6000000,
        salaryMax: 10000000,
        province: 'Jawa Timur',
        city: 'Surabaya',
        isRemote: false,
        latitude: -7.2575,
        longitude: 112.7521,
        requiredSkills: ['teknik mesin', 'teknik listrik', 'instrumentasi', 'safety'],
        preferredSegments: ['SMK'],
        educationMin: 'SMK',
        experienceMin: 0,
        openForDifabel: false,
      }
    },
    {
      companyName: 'PT Pertamina (Persero)',
      data: {
        title: 'Staff Administrasi (Program Difabel)',
        description: 'Pertamina berkomitmen memenuhi kuota 1% karyawan disabilitas sesuai UU. Buka rekrutmen khusus untuk penyandang disabilitas fisik dan tuna rungu pada posisi administrasi.',
        requirements: ['Minimal SMA/SMK sederajat', 'Mampu mengoperasikan komputer', 'Penyandang disabilitas (fisik/tuna rungu)', 'Komunikatif dan teliti'],
        benefits: ['Gaji setara karyawan reguler', 'Fasilitas aksesibilitas', 'BPJS Kesehatan & Ketenagakerjaan', 'Flexible working arrangement'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Administration',
        salaryMin: 5000000,
        salaryMax: 8000000,
        province: 'DKI Jakarta',
        city: 'Jakarta Pusat',
        isRemote: false,
        latitude: -6.1876,
        longitude: 106.8314,
        requiredSkills: ['administrasi', 'microsoft office', 'komputer', 'filing'],
        preferredSegments: ['DIFABEL'],
        educationMin: 'SMK',
        experienceMin: 0,
        openForDifabel: true,
        difabelTypes: ['fisik', 'tuna rungu'],
      }
    },
    // AGRITECH JOBS
    {
      companyName: 'PT Sayur Mayur Agritech',
      data: {
        title: 'Field Agriculture Specialist',
        description: 'Bergabunglah sebagai spesialis lapangan untuk membantu petani muda mengadopsi teknologi pertanian modern. Kamu akan menjadi jembatan antara petani dan teknologi.',
        requirements: ['Latar belakang pertanian/agribisnis', 'Bersedia turun ke lapangan', 'Familiar dengan teknologi digital dasar', 'Memiliki empati tinggi terhadap komunitas petani'],
        benefits: ['Gaji + tunjangan lapangan', 'Motor dinas', 'Pulsa & kuota internet', 'Training pertanian modern', 'Bonus hasil panen'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Agriculture',
        salaryMin: 4000000,
        salaryMax: 7000000,
        province: 'Jawa Barat',
        city: 'Bandung',
        isRemote: false,
        latitude: -6.9590,
        longitude: 107.7470,
        requiredSkills: ['pertanian', 'agribisnis', 'komunikasi', 'field work'],
        preferredSegments: ['PETANI', 'SMK'],
        educationMin: 'SMK',
        experienceMin: 0,
        openForDifabel: false,
      }
    },
    {
      companyName: 'PT Sayur Mayur Agritech',
      data: {
        title: 'Data Entry & Logistik (TKI Returnee Program)',
        description: 'Program khusus untuk TKI returnee yang ingin beralih ke pekerjaan formal dalam negeri. Tidak perlu pengalaman IT, kami sediakan pelatihan lengkap.',
        requirements: ['TKI returnee diutamakan', 'Minimal lulusan SMP', 'Mau belajar hal baru', 'Jujur dan rajin'],
        benefits: ['Gaji UMR Bandung', 'Pelatihan komputer gratis', 'BPJS', 'Mess karyawan tersedia', 'Kesempatan karir internal'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Operations',
        salaryMin: 3500000,
        salaryMax: 5000000,
        province: 'Jawa Barat',
        city: 'Bandung',
        isRemote: false,
        latitude: -6.9590,
        longitude: 107.7470,
        requiredSkills: ['data entry', 'logistik', 'komputer dasar'],
        preferredSegments: ['TKI', 'UMUM'],
        educationMin: 'SMP',
        experienceMin: 0,
        openForDifabel: false,
      }
    },
    // UNILEVER JOBS
    {
      companyName: 'PT Unilever Indonesia Tbk',
      data: {
        title: 'Operator Produksi (SMK Program)',
        description: 'Program rekrutmen massal Unilever untuk operator produksi dari lulusan SMK terbaik. Dapatkan pengalaman kerja di fasilitas produksi FMCG berkelas dunia.',
        requirements: ['Lulusan SMK (Kimia/Teknik/Industri)', 'Usia 18-25 tahun', 'Sehat jasmani dan rohani', 'Bersedia bekerja 3 shift'],
        benefits: ['Gaji + uang makan + transport', 'BPJS Kesehatan & Ketenagakerjaan', 'Jamsostek', 'Meal subsidy', 'Uniform dinas'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Manufacturing',
        salaryMin: 4500000,
        salaryMax: 6500000,
        province: 'Banten',
        city: 'Tangerang',
        isRemote: false,
        latitude: -6.2154,
        longitude: 106.6437,
        requiredSkills: ['teknik kimia', 'operasional mesin', 'quality control', 'safety'],
        preferredSegments: ['SMK'],
        educationMin: 'SMK',
        experienceMin: 0,
        openForDifabel: false,
      }
    },
    {
      companyName: 'PT Bukalapak.com Tbk',
      data: {
        title: 'Quality Assurance Engineer',
        description: 'Kami mencari QA Engineer yang detail-oriented untuk memastikan kualitas produk Bukalapak. Terbuka untuk lulusan SMK RPL yang memiliki kemampuan testing.',
        requirements: ['Memahami manual & automated testing', 'Familiar dengan tools: Selenium/Appium/Postman', 'Pengalaman min. 1 tahun di QA', 'Analytical thinking'],
        benefits: ['Gaji kompetitif', 'Flexible working', 'Health & dental insurance', 'Training budget', 'Snacks & beverages'],
        type: 'FULL_TIME',
        status: 'OPEN',
        category: 'Technology',
        salaryMin: 7000000,
        salaryMax: 14000000,
        province: 'DKI Jakarta',
        city: 'Jakarta Selatan',
        isRemote: true,
        latitude: -6.2607,
        longitude: 106.8160,
        requiredSkills: ['testing', 'qa', 'selenium', 'postman', 'analytical'],
        preferredSegments: ['SMK', 'UMUM'],
        educationMin: 'SMK',
        experienceMin: 1,
        openForDifabel: true,
        difabelTypes: ['fisik', 'tuna rungu'],
      }
    },
  ]

  const createdJobs = []
  for (const jd of jobsData) {
    const comp = companyMap[jd.companyName]
    if (!comp) continue
    const job = await prisma.job.create({
      data: { companyId: comp.id, ...jd.data }
    })
    createdJobs.push(job)
  }

  // ── USER WORKERS ─────────────────────────────────────────────────────────
  const workers = [
    {
      email: 'budi.smk@gmail.com',
      name: 'Budi Santoso',
      segment: 'SMK',
      profile: {
        phone: '081234567890',
        bio: 'Lulusan SMK RPL Surabaya, passionate di web development. Siap berkarir di industri teknologi.',
        province: 'Jawa Timur',
        city: 'Surabaya',
        latitude: -7.2575,
        longitude: 112.7521,
        educationLevel: 'SMK',
        school: 'SMKN 1 Surabaya',
        major: 'Rekayasa Perangkat Lunak',
        graduationYear: 2024,
        yearsExperience: 0,
        expectedSalary: 6000000,
        skills: ['html', 'css', 'javascript', 'react', 'git', 'figma'],
        preferredJob: ['Frontend Developer', 'Web Developer'],
        smkJurusan: 'Rekayasa Perangkat Lunak',
      }
    },
    {
      email: 'sari.tki@gmail.com',
      name: 'Sari Dewi',
      segment: 'TKI',
      profile: {
        phone: '082345678901',
        bio: 'Mantan TKI di Malaysia 5 tahun. Menguasai administrasi, customer service, dan berbahasa Melayu/Inggris dasar. Siap beralih ke karir formal dalam negeri.',
        province: 'Jawa Tengah',
        city: 'Semarang',
        latitude: -6.9667,
        longitude: 110.4167,
        educationLevel: 'SMK',
        school: 'SMKN 3 Semarang',
        major: 'Akuntansi',
        graduationYear: 2018,
        yearsExperience: 5,
        expectedSalary: 4500000,
        skills: ['administrasi', 'customer service', 'microsoft office', 'komunikasi', 'bahasa inggris'],
        certifications: ['Sertifikat Bahasa Melayu', 'Sertifikat Housekeeping Malaysia'],
        preferredJob: ['Customer Service', 'Administrasi', 'Data Entry'],
        tikiDestination: 'Malaysia',
      }
    },
    {
      email: 'petani.andi@gmail.com',
      name: 'Andi Pratama',
      segment: 'PETANI',
      profile: {
        phone: '083456789012',
        bio: 'Petani muda dari Bandung yang ingin bertransisi ke agribisnis modern. Menguasai pertanian organik dan teknik hidroponik.',
        province: 'Jawa Barat',
        city: 'Bandung',
        latitude: -6.9175,
        longitude: 107.6191,
        educationLevel: 'SMK',
        school: 'SMKN Pertanian Lembang',
        major: 'Agribisnis',
        graduationYear: 2021,
        yearsExperience: 3,
        expectedSalary: 4000000,
        skills: ['pertanian', 'agribisnis', 'hidroponik', 'organik farming', 'field work', 'komunikasi'],
        preferredJob: ['Field Agriculture Specialist', 'Agribisnis Specialist', 'Farm Manager'],
        petaniCommodity: 'Sayuran Organik',
      }
    },
    {
      email: 'difabel.rini@gmail.com',
      name: 'Rini Kusuma',
      segment: 'DIFABEL',
      profile: {
        phone: '084567890123',
        bio: 'Penyandang disabilitas fisik (pengguna kursi roda). Lulusan SMK Akuntansi dengan keahlian administrasi dan Microsoft Office. Produktif dan mandiri.',
        province: 'DKI Jakarta',
        city: 'Jakarta Pusat',
        latitude: -6.1751,
        longitude: 106.8650,
        educationLevel: 'SMK',
        school: 'SMKN 50 Jakarta',
        major: 'Akuntansi',
        graduationYear: 2022,
        yearsExperience: 1,
        expectedSalary: 5000000,
        skills: ['administrasi', 'microsoft office', 'excel', 'akuntansi', 'filing', 'data entry'],
        certifications: ['Sertifikat Microsoft Office Specialist'],
        preferredJob: ['Staff Administrasi', 'Data Entry', 'Accounting'],
        difabelType: 'Fisik (pengguna kursi roda)',
      }
    },
    {
      email: 'ahmad.dev@gmail.com',
      name: 'Ahmad Fauzi',
      segment: 'SMK',
      profile: {
        phone: '085678901234',
        bio: 'Lulusan SMK TKJ dengan keahlian networking dan sistem. Sudah punya pengalaman freelance 2 tahun sebagai IT support.',
        province: 'DKI Jakarta',
        city: 'Jakarta Timur',
        latitude: -6.2251,
        longitude: 106.9004,
        educationLevel: 'SMK',
        school: 'SMKN 26 Jakarta',
        major: 'Teknik Komputer dan Jaringan',
        graduationYear: 2022,
        yearsExperience: 2,
        expectedSalary: 7000000,
        skills: ['networking', 'linux', 'windows server', 'mikrotik', 'cisco', 'it support'],
        certifications: ['Cisco CCNA (basic)', 'Mikrotik MTCNA'],
        preferredJob: ['IT Support', 'Network Engineer', 'System Administrator'],
        smkJurusan: 'Teknik Komputer dan Jaringan',
      }
    },
    {
      email: 'maya.return@gmail.com',
      name: 'Maya Sari',
      segment: 'TKI',
      profile: {
        phone: '086789012345',
        bio: 'TKI returnee dari Hongkong 7 tahun. Fasih Bahasa Inggris dan Kantonis. Terlatih dalam manajemen rumah tangga premium. Siap re-skilling untuk industri hospitality.',
        province: 'Jawa Timur',
        city: 'Malang',
        latitude: -7.9797,
        longitude: 112.6304,
        educationLevel: 'SMA',
        school: 'SMAN 5 Malang',
        graduationYear: 2015,
        yearsExperience: 7,
        expectedSalary: 5000000,
        skills: ['bahasa inggris', 'bahasa kantonis', 'hospitality', 'customer service', 'housekeeping', 'komunikasi'],
        certifications: ['English Proficiency Certificate HK', 'First Aid Certificate'],
        preferredJob: ['Customer Service', 'Hospitality Staff', 'Front Office'],
        tikiDestination: 'Hongkong',
      }
    },
  ]

  const createdUsers = []
  for (const w of workers) {
    const user = await prisma.user.create({
      data: {
        email: w.email,
        password: hashPw('user123'),
        name: w.name,
        role: 'USER',
        segment: w.segment,
        isVerified: true,
        profile: { create: w.profile }
      },
      include: { profile: true }
    })
    createdUsers.push(user)
  }

  // ── TRAININGS ────────────────────────────────────────────────────────────
  await prisma.training.createMany({
    data: [
      { title: 'React.js Fundamentals', provider: 'Dicoding', url: 'https://dicoding.com/academies/314', skills: ['react', 'javascript', 'html', 'css'], segments: ['SMK', 'UMUM'], duration: '40 jam', isFree: true },
      { title: 'Full Stack Web Developer', provider: 'Ruangguru', url: 'https://ruangguru.com', skills: ['html', 'css', 'javascript', 'nodejs', 'react'], segments: ['SMK', 'UMUM'], duration: '120 jam', isFree: false },
      { title: 'Android Developer (Kotlin)', provider: 'Google Bangkit', url: 'https://grow.google/intl/id_id/bangkit/', skills: ['kotlin', 'android', 'mobile development'], segments: ['SMK', 'UMUM'], duration: '900 jam', isFree: true },
      { title: 'Microsoft Office Expert', provider: 'Prakerja', url: 'https://prakerja.go.id', skills: ['microsoft office', 'excel', 'word', 'administrasi'], segments: ['SMK', 'TKI', 'DIFABEL', 'UMUM'], duration: '20 jam', isFree: true },
      { title: 'Customer Service Excellence', provider: 'BNSP', url: 'https://bnsp.go.id', skills: ['customer service', 'komunikasi', 'problem solving'], segments: ['SMK', 'TKI', 'UMUM'], duration: '30 jam', isFree: false },
      { title: 'Pertanian Organik Modern', provider: 'Kementan', url: 'https://pertanian.go.id', skills: ['pertanian', 'organik farming', 'agribisnis'], segments: ['PETANI'], duration: '50 jam', isFree: true },
      { title: 'Hidroponik & Aquaponik', provider: 'IPB University', url: 'https://ipb.ac.id', skills: ['hidroponik', 'aquaponik', 'pertanian modern'], segments: ['PETANI', 'SMK'], duration: '40 jam', isFree: false },
      { title: 'Bahasa Inggris untuk Kerja', provider: 'British Council', url: 'https://britishcouncil.org', skills: ['bahasa inggris', 'komunikasi'], segments: ['TKI', 'UMUM'], duration: '60 jam', isFree: false },
      { title: 'Cisco CCNA Preparation', provider: 'Cisco NetAcad', url: 'https://netacad.com', skills: ['networking', 'cisco', 'it support'], segments: ['SMK'], duration: '80 jam', isFree: true },
      { title: 'Aksesibilitas Digital untuk Difabel', provider: 'Kominfo', url: 'https://kominfo.go.id', skills: ['komputer', 'administrasi', 'data entry'], segments: ['DIFABEL'], duration: '25 jam', isFree: true },
    ]
  })

  // ── SKILL GAPS ───────────────────────────────────────────────────────────
  await prisma.skillGap.createMany({
    data: [
      {
        userId: createdUsers[0].id, // Budi SMK
        targetJobTitle: 'Software Engineer - Android',
        missingSkills: ['kotlin', 'android', 'mobile development'],
        recommendations: ['Android Developer (Kotlin) - Google Bangkit', 'Pelajari Kotlin di kotlinlang.org secara gratis'],
      },
      {
        userId: createdUsers[2].id, // Andi Petani
        targetJobTitle: 'Merchant Partnership Executive',
        missingSkills: ['sales', 'digital marketing'],
        recommendations: ['Digital Marketing Fundamentals - Google', 'Sales Fundamentals - Prakerja'],
      }
    ]
  })

  console.log('✅ Seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`  👤 Users: ${createdUsers.length + companyUsers.length + 1} (${createdUsers.length} workers, ${companyUsers.length} companies, 1 admin)`)
  console.log(`  🏢 Companies: ${companies.length}`)
  console.log(`  💼 Jobs: ${createdJobs.length}`)
  console.log(`  📚 Trainings: 10`)
  console.log(`\n🔑 Test Accounts:`)
  console.log(`  Admin:   admin@karya.id    / admin123`)
  console.log(`  Worker:  budi.smk@gmail.com / user123`)
  console.log(`  TKI:     sari.tki@gmail.com / user123`)
  console.log(`  Petani:  petani.andi@gmail.com / user123`)
  console.log(`  Difabel: difabel.rini@gmail.com / user123`)
  console.log(`  Company: hr@tokopedia.id   / company123`)
}

main()
  .catch(e => { console.error('❌ Seed error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
