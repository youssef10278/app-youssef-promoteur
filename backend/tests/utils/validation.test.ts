import { validate, loginSchema, registerSchema, createProjectSchema } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = validate(loginSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      expect(() => validate(loginSchema, invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      
      expect(() => validate(loginSchema, invalidData)).toThrow();
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User',
        telephone: '0612345678',
        societe: 'Test Company',
      };
      
      const result = validate(registerSchema, validData);
      expect(result.email).toBe(validData.email);
      expect(result.nom).toBe(validData.nom);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
        nom: 'Test User',
      };
      
      expect(() => validate(registerSchema, invalidData)).toThrow(/6 caractères/);
    });

    it('should reject short name', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'T',
      };
      
      expect(() => validate(registerSchema, invalidData)).toThrow(/2 caractères/);
    });

    it('should allow optional fields to be empty', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User',
        telephone: '',
        societe: '',
      };
      
      const result = validate(registerSchema, validData);
      expect(result).toBeDefined();
    });
  });

  describe('createProjectSchema', () => {
    it('should validate correct project data', () => {
      const validData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
        nombre_appartements: 8,
        nombre_garages: 2,
        description: 'Test description',
      };
      
      const result = validate(createProjectSchema, validData);
      expect(result.nom).toBe(validData.nom);
      expect(result.surface_totale).toBe(validData.surface_totale);
    });

    it('should reject negative surface', () => {
      const invalidData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: -100,
        nombre_lots: 10,
      };
      
      expect(() => validate(createProjectSchema, invalidData)).toThrow();
    });

    it('should reject zero lots', () => {
      const invalidData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 0,
      };
      
      expect(() => validate(createProjectSchema, invalidData)).toThrow();
    });

    it('should set default values for optional fields', () => {
      const validData = {
        nom: 'Test Project',
        localisation: 'Test Location',
        societe: 'Test Company',
        surface_totale: 1000,
        nombre_lots: 10,
      };
      
      const result = validate(createProjectSchema, validData);
      expect(result.nombre_appartements).toBe(0);
      expect(result.nombre_garages).toBe(0);
    });
  });
});

