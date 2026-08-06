import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('AcademyService', () => {
  let service: AcademyService;

  const prisma = {
    academy: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademyService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AcademyService);
    jest.clearAllMocks();
  });

  it('creates an academy with generated slug', async () => {
    prisma.academy.findUnique.mockResolvedValue(null);
    prisma.academy.create.mockResolvedValue({
      id: 'academy-1',
      name: 'Greenwood Academy',
      slug: 'greenwood-academy',
    });

    const result = await service.create({ name: 'Greenwood Academy' });

    expect(result.slug).toBe('greenwood-academy');
    expect(prisma.academy.create).toHaveBeenCalled();
  });

  it('throws when academy is not found', async () => {
    prisma.academy.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when slug already exists on update', async () => {
    prisma.academy.findUnique.mockResolvedValue({ id: 'academy-1' });
    prisma.academy.findFirst.mockResolvedValue({ id: 'academy-2' });

    await expect(
      service.update('academy-1', { slug: 'taken-slug' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
