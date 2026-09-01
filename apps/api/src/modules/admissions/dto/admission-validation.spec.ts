import { AdmissionStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ReviewAdmissionDto } from './review-admission.dto';
import { SubmitAdmissionDto } from './submit-admission.dto';
import { SubmitWebsiteAdmissionDto } from './submit-website-admission.dto';

describe('Admission DTO validation', () => {
  const validSubmission = {
    academicOfferingId: 'offering-1',
    studentFullName: 'QA Student',
    studentCnic: '3520212345671',
    guardianFullName: 'QA Guardian',
    guardianContactNumber: '03001234567',
  };

  it('accepts a valid admission submission', async () => {
    await expect(
      validate(plainToInstance(SubmitAdmissionDto, validSubmission)),
    ).resolves.toHaveLength(0);
  });

  it('rejects whitespace-only required names', async () => {
    const errors = await validate(
      plainToInstance(SubmitAdmissionDto, {
        ...validSubmission,
        studentFullName: '   ',
        guardianFullName: '   ',
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['studentFullName', 'guardianFullName']),
    );
  });

  it('rejects invalid CNIC and contact formats', async () => {
    const errors = await validate(
      plainToInstance(SubmitAdmissionDto, {
        ...validSubmission,
        studentCnic: '123',
        guardianContactNumber: 'not-a-number',
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['studentCnic', 'guardianContactNumber']),
    );
  });

  it('accepts Pakistan phone formats on website applications', async () => {
    const application = {
      academicOfferingId: 'offering-1',
      studentFullName: 'QA Student',
      studentCnic: '3520212345671',
      dateOfBirth: '2015-01-01',
      gender: 'MALE',
      guardianFullName: 'QA Guardian',
      relationship: 'Father',
      guardianPhone: '+923451234567',
      address: 'Lahore, Pakistan',
    };
    await expect(
      validate(plainToInstance(SubmitWebsiteAdmissionDto, application)),
    ).resolves.toHaveLength(0);
  });

  it('rejects website bots and invalid mobile numbers', async () => {
    const errors = await validate(
      plainToInstance(SubmitWebsiteAdmissionDto, {
        academicOfferingId: 'offering-1',
        studentFullName: 'QA Student',
        studentCnic: '3520212345671',
        dateOfBirth: '2015-01-01',
        gender: 'MALE',
        guardianFullName: 'QA Guardian',
        relationship: 'Father',
        guardianPhone: '123',
        address: 'Lahore',
        website: 'spam',
      }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['guardianPhone', 'website']),
    );
  });

  it('only accepts approved or rejected review decisions', async () => {
    const errors = await validate(
      plainToInstance(ReviewAdmissionDto, {
        status: AdmissionStatus.PENDING,
      }),
    );
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('requires a meaningful rejection reason', async () => {
    const missing = await validate(
      plainToInstance(ReviewAdmissionDto, {
        status: AdmissionStatus.REJECTED,
      }),
    );
    const blank = await validate(
      plainToInstance(ReviewAdmissionDto, {
        status: AdmissionStatus.REJECTED,
        reviewNote: '   ',
      }),
    );
    expect(missing.some((error) => error.property === 'reviewNote')).toBe(true);
    expect(blank.some((error) => error.property === 'reviewNote')).toBe(true);
  });

  it('requires an academic term for approval', async () => {
    const errors = await validate(
      plainToInstance(ReviewAdmissionDto, {
        status: AdmissionStatus.APPROVED,
      }),
    );
    expect(errors.some((error) => error.property === 'academicTermId')).toBe(
      true,
    );
  });
});
