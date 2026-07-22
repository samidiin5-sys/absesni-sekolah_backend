'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Users (Admin and Teachers)
    const saltRound = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRound);
    const teacherPassword = await bcrypt.hash('guru123', saltRound);

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        name: 'Administrator',
        nip: null,
        email: 'admin@sekolah.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Budi Rahardjo, S.Pd.',
        nip: '198503112010121001',
        email: 'budi@sekolah.com',
        password: teacherPassword,
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'Siti Aminah, M.Pd.',
        nip: '199008242015042002',
        email: 'siti@sekolah.com',
        password: teacherPassword,
        role: 'teacher',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 2. Seed Classes
    await queryInterface.bulkInsert('classes', [
      {
        id: 1,
        name: 'PPLG XI-1',
        major: 'Pengembangan Perangkat Lunak dan Gim',
        grade: 11,
        schoolYear: '2026/2027',
        homeroomTeacher: 'Budi Rahardjo, S.Pd.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'PPLG XI-2',
        major: 'Pengembangan Perangkat Lunak dan Gim',
        grade: 11,
        schoolYear: '2026/2027',
        homeroomTeacher: 'Siti Aminah, M.Pd.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'PPLG XII-1',
        major: 'Pengembangan Perangkat Lunak dan Gim',
        grade: 12,
        schoolYear: '2026/2027',
        homeroomTeacher: 'Eko Prasetyo, S.Kom.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 3. Seed Subjects
    await queryInterface.bulkInsert('subjects', [
      {
        id: 1,
        code: 'MTK-11',
        name: 'Matematika XI',
        teacherId: 2, // Budi Rahardjo
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        code: 'WEB-11',
        name: 'Pemrograman Web XI',
        teacherId: 2, // Budi Rahardjo
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        code: 'BASDAT-11',
        name: 'Basis Data XI',
        teacherId: 3, // Siti Aminah
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        code: 'ING-12',
        name: 'Bahasa Inggris XII',
        teacherId: 3, // Siti Aminah
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    // 4. Seed Students
    await queryInterface.bulkInsert('students', [
      {
        id: 1,
        nis: '102601',
        fullName: 'Ahmad Fauzi',
        gender: 'male',
        classId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nis: '102602',
        fullName: 'Annisa Fitriani',
        gender: 'female',
        classId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        nis: '102603',
        fullName: 'Bagas Wibowo',
        gender: 'male',
        classId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        nis: '102604',
        fullName: 'Citra Lestari',
        gender: 'female',
        classId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        nis: '102605',
        fullName: 'Dewi Sartika',
        gender: 'female',
        classId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        nis: '102606',
        fullName: 'Fajar Nugraha',
        gender: 'male',
        classId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        nis: '102607',
        fullName: 'Gita Permata',
        gender: 'female',
        classId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        nis: '102608',
        fullName: 'Hendra Wijaya',
        gender: 'male',
        classId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        nis: '102609',
        fullName: 'Indah Cahyani',
        gender: 'female',
        classId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 10,
        nis: '102610',
        fullName: 'Joko Susilo',
        gender: 'male',
        classId: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order of dependencies
    await queryInterface.bulkDelete('students', null, {});
    await queryInterface.bulkDelete('subjects', null, {});
    await queryInterface.bulkDelete('classes', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
