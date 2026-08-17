import { validate } from 'class-validator';
import { CreateNoteDto } from './create-note.dto';
import { UpdateNoteDto } from './update-note.dto';

const limit = 2_000_000;

describe('note content validation', () => {
  it('accepts create and update content at the two-million-character limit', async () => {
    const content = 'a'.repeat(limit);
    const create = Object.assign(new CreateNoteDto(), {
      title: 'Large note',
      content,
    });
    const update = Object.assign(new UpdateNoteDto(), { content });

    await expect(validate(create)).resolves.toHaveLength(0);
    await expect(validate(update)).resolves.toHaveLength(0);
  });

  it('rejects oversized create and update content without modifying it', async () => {
    const content = 'a'.repeat(limit + 1);
    const create = Object.assign(new CreateNoteDto(), {
      title: 'Oversized note',
      content,
    });
    const update = Object.assign(new UpdateNoteDto(), { content });

    const [createErrors, updateErrors] = await Promise.all([
      validate(create),
      validate(update),
    ]);

    expect(createErrors[0]?.constraints?.maxLength).toBeDefined();
    expect(updateErrors[0]?.constraints?.maxLength).toBeDefined();
    expect(create.content).toHaveLength(limit + 1);
    expect(update.content).toHaveLength(limit + 1);
  });
});
