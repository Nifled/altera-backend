import { ImageFilesValidatorPipe } from './image-file-validator.pipe';

describe('ImageFileValidatorPipe', () => {
  const pipe = new ImageFilesValidatorPipe();

  const testFiles = [
    {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('This is a test file'),
      size: 5 * 1024, // 5KB
    },
    {
      mimetype: 'image/jpeg',
      buffer: Buffer.from('This is another test file'),
      size: 5 * 1024, // 5KB
    },
  ];

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return payload if validation passes', () => {
    const payload = pipe.transform(testFiles);

    expect(payload).toBeDefined();
  });

  it('should throw an exception file is not valid', () => {
    const badFile = {
      mimetype: '',
      buffer: Buffer.from('This is a test file'),
      size: 5 * 1024, // 5KB
    };

    expect(() =>
      pipe.transform([badFile as Express.Multer.File]),
    ).toThrowError();
  });
});
