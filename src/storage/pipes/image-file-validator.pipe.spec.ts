import { ImageFileValidatorPipe } from './image-file-validator.pipe';

describe('ImageFileValidatorPipe', () => {
  const pipe = new ImageFileValidatorPipe();

  const testFile = {
    mimetype: 'image/jpeg',
    buffer: Buffer.from('This is a test file'),
    size: 5 * 1024, // 5KB
  };

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return payload if validation passes', () => {
    const payload = pipe.transform(testFile as Express.Multer.File);

    expect(payload).toBeDefined();
  });

  it('should throw an exception file is not valid', () => {
    expect(() =>
      pipe.transform({ ...testFile, mimetype: '' } as Express.Multer.File),
    ).toThrowError();
  });
});
