-- Fix foreign key constraints for equipment_loan_slip table
-- The foreign keys should reference 'partner' table, not 'user' table

USE device_management;

-- Drop existing incorrect foreign key constraints
ALTER TABLE `equipment_loan_slip` DROP FOREIGN KEY `equipment_loan_slip_ibfk_1`;
ALTER TABLE `equipment_loan_slip` DROP FOREIGN KEY `equipment_loan_slip_ibfk_2`;

-- Add correct foreign key constraints referencing 'partner' table
ALTER TABLE `equipment_loan_slip`
  ADD CONSTRAINT `equipment_loan_slip_ibfk_1`
  FOREIGN KEY (`equipment_borrower_id`)
  REFERENCES `partner` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE `equipment_loan_slip`
  ADD CONSTRAINT `equipment_loan_slip_ibfk_2`
  FOREIGN KEY (`equipment_loaner_id`)
  REFERENCES `partner` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
