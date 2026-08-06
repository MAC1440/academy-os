import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BranchService } from './branch.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('BranchService', () => {
  let service: BranchService;

  const prisma = {
    academy: {
      findUnique: jest.fn(),
    },
    branch: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(BranchService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a branch successfully when academy exists', async () => {
      prisma.academy.findUnique.mockResolvedValue({ id: 'academy-1', name: 'Test Academy' });
      prisma.branch.create.mockResolvedValue({
        id: 'branch-1',
        academyId: 'academy-1',
        name: 'Main Campus',
      });

      const result = await service.create({
        academyId: 'academy-1',
        name: 'Main Campus',
      });

      expect(result.id).toBe('branch-1');
      expect(prisma.branch.create).toHaveBeenCalledWith({
        data: {
          academyId: 'academy-1',
          name: 'Main Campus',
          address: undefined,
          city: undefined,
          country: undefined,
          phone: undefined,
          email: undefined,
          status: undefined,
        },
      });
    });

    it('throws BadRequestException if parent academy does not exist', async () => {
      prisma.academy.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ academyId: 'invalid', name: 'Main Campus' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated branches list', async () => {
      prisma.branch.findMany.mockResolvedValue([
        { id: 'branch-1', name: 'Main Campus' },
      ]);
      prisma.branch.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('returns branch if found', async () => {
      prisma.branch.findUnique.mockResolvedValue({
        id: 'branch-1',
        name: 'Main Campus',
      });

      const result = await service.findOne('branch-1');
      expect(result.id).toBe('branch-1');
    });

    it('throws NotFoundException if branch not found', async () => {
      prisma.branch.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates branch details', async () => {
      prisma.branch.findUnique.mockResolvedValue({
        id: 'branch-1',
        name: 'Old Name',
      });
      prisma.branch.update.mockResolvedValue({
        id: 'branch-1',
        name: 'New Name',
      });

      const result = await service.update('branch-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(prisma.branch.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes branch', async () => {
      prisma.branch.findUnique.mockResolvedValue({ id: 'branch-1' });
      prisma.branch.delete.mockResolvedValue({ id: 'branch-1' });

      const result = await service.remove('branch-1');
      expect(result.id).toBe('branch-1');
    });
  });
});
