-- Fix foreign key constraint for equipment_loaner_id
-- The loaner should reference 'user' table, not 'partner' table

USE device_management;

-- Drop existing foreign key constraint for equipment_loaner_id
ALTER TABLE `equipment_loan_slip` DROP FOREIGN KEY `equipment_loan_slip_ibfk_2`;

-- Add correct foreign key constraint referencing 'user' table
ALTER TABLE `equipment_loan_slip`
  ADD CONSTRAINT `equipment_loan_slip_ibfk_2`
  FOREIGN KEY (`equipment_loaner_id`)
  REFERENCES `user` (`id`)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
