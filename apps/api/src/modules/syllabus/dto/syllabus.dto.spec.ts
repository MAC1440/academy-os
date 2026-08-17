import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSessionSyllabusDto } from './syllabus.dto';

const validDocument = {
  sessionYear: '2026-27',
  classes: [
    {
      className: '9th',
      groups: [
        {
          name: 'Pre-Board',
          subjects: [
            {
              subjectName: 'Mathematics',
              content: '**Algebra**\n\n- Equations',
            },
            { subjectName: 'Revision Work', content: 'Custom subject content' },
          ],
        },
      ],
    },
  ],
};

describe('Syllabus DTO validation', () => {
  it('accepts custom groups, existing subject names, custom subjects, and rich text', async () => {
    const errors = await validate(
      plainToInstance(CreateSessionSyllabusDto, validDocument),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejects malformed nested syllabus data', async () => {
    const malformed = plainToInstance(CreateSessionSyllabusDto, {
      sessionYear: '2026',
      classes: [{ className: '', groups: [{ name: 42, subjects: [{}] }] }],
    });
    const errors = await validate(malformed);
    expect(errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(errors)).toContain('classes');
  });
});
