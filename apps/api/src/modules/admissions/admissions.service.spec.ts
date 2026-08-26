import { ConflictException } from '@nestjs/common';
import { AdmissionStatus } from '@prisma/client';
import { AdmissionsService } from './admissions.service';

describe('AdmissionsService hardening', () => {
  function setup() {
    const prisma = {
      academicTerm: { findFirst: jest.fn() },
      admissionApplication: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = new AdmissionsService(prisma as never, {} as never);
    jest.spyOn(service as never, 'activeOffering').mockResolvedValue({
      id: 'offering-1',
      branchId: 'branch-1',
    });
    jest.spyOn(service as never, 'organization').mockResolvedValue({
      id: 'organization-1',
    });
    jest
      .spyOn(service as never, 'ensureBranchAccess')
      .mockResolvedValue(undefined);
    jest.spyOn(service as never, 'audit').mockResolvedValue(undefined);
    return { prisma, service };
  }

  it('blocks another active admission in the current academic term', async () => {
    const { prisma, service } = setup();
    prisma.academicTerm.findFirst.mockResolvedValue({ id: 'term-1' });
    prisma.admissionApplication.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.submit({
        academicOfferingId: 'offering-1',
        studentFullName: 'QA Student',
        studentCnic: '3520212345671',
        guardianFullName: 'QA Guardian',
        guardianContactNumber: '03001234567',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.admissionApplication.create).not.toHaveBeenCalled();
  });

  it('updates a pending admission without overwriting unrelated submitted data', async () => {
    const { prisma, service } = setup();
    jest.spyOn(service as never, 'application').mockResolvedValue({
      id: 'application-1',
      branchId: 'branch-1',
      status: AdmissionStatus.PENDING,
      formData: { dateOfBirth: '2015-01-01' },
    });
    prisma.admissionApplication.update.mockResolvedValue({
      id: 'application-1',
    });

    await service.update(
      'application-1',
      { guardianFullName: 'Updated Guardian' },
      'admin-1',
    );

    expect(prisma.admissionApplication.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { guardianFullName: 'Updated Guardian' },
      }),
    );
  });
});
