-- ========================
-- TABLES
-- ========================

CREATE TABLE users (
                       id BIGINT NOT NULL AUTO_INCREMENT,
                       created_at DATETIME(6),
                       password_reset_otp_expiry DATETIME(6),
                       name VARCHAR(40) NOT NULL,
                       address VARCHAR(255),
                       city VARCHAR(255),
                       email VARCHAR(255) NOT NULL,
                       location VARCHAR(255),
                       oauth_provider VARCHAR(255),
                       oauth_provider_id VARCHAR(255),
                       password VARCHAR(255),
                       password_reset_otp VARCHAR(255),
                       role ENUM ('ADMIN','BUYER','FARM_OWNER','WORKER') NOT NULL,
                       PRIMARY KEY (id),
                       UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE farms (
                       id BIGINT NOT NULL AUTO_INCREMENT,
                       buffalo_price FLOAT,
                       cow_price FLOAT,
                       goat_price FLOAT,
                       is_selling BIT NOT NULL,
                       price_per_liter FLOAT,
                       sheep_price FLOAT,
                       owner_id BIGINT NOT NULL,
                       address VARCHAR(255),
                       city VARCHAR(255),
                       name VARCHAR(255) NOT NULL,
                       PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE sheds (
                       id BIGINT NOT NULL AUTO_INCREMENT,
                       farm_id BIGINT NOT NULL,
                       name VARCHAR(255) NOT NULL,
                       PRIMARY KEY (id),
                       UNIQUE (farm_id, name)
) ENGINE=InnoDB;

CREATE TABLE cattle (
                        id BIGINT NOT NULL AUTO_INCREMENT,
                        dob DATETIME(6),
                        farm_id BIGINT NOT NULL,
                        shed_id BIGINT,
                        weight BIGINT,
                        breed VARCHAR(255),
                        status VARCHAR(255),
                        tag_id VARCHAR(255) NOT NULL,
                        type VARCHAR(255),
                        PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE farm_workers (
                              id BIGINT NOT NULL AUTO_INCREMENT,
                              farm_id BIGINT NOT NULL,
                              worker_id BIGINT NOT NULL,
                              PRIMARY KEY (id),
                              UNIQUE (farm_id, worker_id)
) ENGINE=InnoDB;

CREATE TABLE farm_worker_sheds (
                                   id BIGINT NOT NULL AUTO_INCREMENT,
                                   farm_worker_id BIGINT NOT NULL,
                                   shed_id BIGINT NOT NULL,
                                   PRIMARY KEY (id),
                                   UNIQUE (farm_worker_id, shed_id)
) ENGINE=InnoDB;

CREATE TABLE cattle_milk_entry (
                                   id BIGINT NOT NULL AUTO_INCREMENT,
                                   milk_liters FLOAT NOT NULL,
                                   record_date DATE NOT NULL,
                                   cattle_id BIGINT NOT NULL,
                                   entered_by BIGINT NOT NULL,
                                   farm_id BIGINT NOT NULL,
                                   session ENUM ('ALL','EVENING','MORNING') NOT NULL,
                                   PRIMARY KEY (id),
                                   UNIQUE (cattle_id, record_date, session)
) ENGINE=InnoDB;

CREATE TABLE farm_daily_conditions (
                                       id BIGINT NOT NULL AUTO_INCREMENT,
                                       cow_count INT,
                                       feed_intake FLOAT,
                                       humidity FLOAT,
                                       record_date DATE,
                                       temperature FLOAT,
                                       vet_visits INT,
                                       water_intake FLOAT,
                                       farm_id BIGINT NOT NULL,
                                       PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE milk_inventory (
                                id BIGINT NOT NULL AUTO_INCREMENT,
                                milk_liters FLOAT NOT NULL,
                                record_date DATE NOT NULL,
                                entered_by BIGINT,
                                farm_id BIGINT NOT NULL,
                                session ENUM ('ALL','EVENING','MORNING') NOT NULL,
                                PRIMARY KEY (id),
                                UNIQUE (record_date, farm_id, session)
) ENGINE=InnoDB;

CREATE TABLE milk_allocations (
                                  id BIGINT NOT NULL AUTO_INCREMENT,
                                  quantity FLOAT NOT NULL,
                                  created_at DATETIME(6),
                                  milk_inventory_id BIGINT NOT NULL,
                                  reference_id BIGINT,
                                  type ENUM ('ORDER','RESERVATION','SUBSCRIPTION') NOT NULL,
                                  PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE milk_forecast (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               forecast_date DATE,
                               predicted_liters FLOAT,
                               farm_id BIGINT NOT NULL,
                               method VARCHAR(255),
                               PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               billing_counter_updated_date DATE,
                               billing_day_counter INT NOT NULL,
                               end_date DATE,
                               quantity FLOAT NOT NULL,
                               skip_date DATE,
                               start_date DATE NOT NULL,
                               display_code VARCHAR(6),
                               buyer_id BIGINT NOT NULL,
                               created_at DATETIME(6),
                               farm_id BIGINT NOT NULL,
                               last_cycle_paid_at DATETIME(6),
                               animal_type VARCHAR(255),
                               session VARCHAR(50) NOT NULL,
                               status VARCHAR(50) NOT NULL,
                               PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE orders (
                        id BIGINT NOT NULL AUTO_INCREMENT,
                        order_date DATE,
                        paid BIT,
                        paid_amount FLOAT,
                        quantity FLOAT,
                        session TINYINT CHECK (session BETWEEN 0 AND 2),
    status TINYINT CHECK (status BETWEEN 0 AND 5),
    total_price FLOAT,
    display_code VARCHAR(6),
    buyer_id BIGINT NOT NULL,
    confirmed_at DATETIME(6),
    created_at DATETIME(6),
    farm_id BIGINT NOT NULL,
    paid_at DATETIME(6),
    subscription_id BIGINT,
    animal_type VARCHAR(255),
    buyer_name VARCHAR(255),
    farm_name VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    time_slot VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE worker_farm_invitations (
                                         id BIGINT NOT NULL AUTO_INCREMENT,
                                         created_at DATETIME(6),
                                         farm_id BIGINT NOT NULL,
                                         worker_id BIGINT NOT NULL,
                                         status ENUM ('ACCEPTED','DECLINED','PENDING') NOT NULL,
                                         PRIMARY KEY (id),
                                         UNIQUE (farm_id, worker_id)
) ENGINE=InnoDB;

-- ========================
-- INDEXES
-- ========================

CREATE INDEX idx_farm_city ON farms (city);
CREATE INDEX idx_user_city ON users (city);
CREATE INDEX idx_order_date ON orders (order_date);
CREATE INDEX idx_order_status ON orders (status);
CREATE INDEX idx_order_farm ON orders (farm_id);

-- ========================
-- FOREIGN KEYS
-- ========================

ALTER TABLE farms ADD CONSTRAINT fk_farm_owner FOREIGN KEY (owner_id) REFERENCES users(id);

ALTER TABLE sheds ADD CONSTRAINT fk_shed_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE cattle
    ADD CONSTRAINT fk_cattle_farm FOREIGN KEY (farm_id) REFERENCES farms(id),
    ADD CONSTRAINT fk_cattle_shed FOREIGN KEY (shed_id) REFERENCES sheds(id);

ALTER TABLE farm_workers
    ADD CONSTRAINT fk_fw_farm FOREIGN KEY (farm_id) REFERENCES farms(id),
    ADD CONSTRAINT fk_fw_user FOREIGN KEY (worker_id) REFERENCES users(id);

ALTER TABLE farm_worker_sheds
    ADD CONSTRAINT fk_fws_fw FOREIGN KEY (farm_worker_id) REFERENCES farm_workers(id),
    ADD CONSTRAINT fk_fws_shed FOREIGN KEY (shed_id) REFERENCES sheds(id);

ALTER TABLE cattle_milk_entry
    ADD CONSTRAINT fk_cme_cattle FOREIGN KEY (cattle_id) REFERENCES cattle(id),
    ADD CONSTRAINT fk_cme_user FOREIGN KEY (entered_by) REFERENCES users(id),
    ADD CONSTRAINT fk_cme_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE farm_daily_conditions
    ADD CONSTRAINT fk_fdc_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE milk_inventory
    ADD CONSTRAINT fk_mi_user FOREIGN KEY (entered_by) REFERENCES users(id),
    ADD CONSTRAINT fk_mi_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE milk_allocations
    ADD CONSTRAINT fk_ma_inventory FOREIGN KEY (milk_inventory_id) REFERENCES milk_inventory(id);

ALTER TABLE milk_forecast
    ADD CONSTRAINT fk_mf_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE subscriptions
    ADD CONSTRAINT fk_sub_user FOREIGN KEY (buyer_id) REFERENCES users(id),
    ADD CONSTRAINT fk_sub_farm FOREIGN KEY (farm_id) REFERENCES farms(id);

ALTER TABLE orders
    ADD CONSTRAINT fk_order_user FOREIGN KEY (buyer_id) REFERENCES users(id),
    ADD CONSTRAINT fk_order_farm FOREIGN KEY (farm_id) REFERENCES farms(id),
    ADD CONSTRAINT fk_order_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(id);

ALTER TABLE worker_farm_invitations
    ADD CONSTRAINT fk_wfi_farm FOREIGN KEY (farm_id) REFERENCES farms(id),
    ADD CONSTRAINT fk_wfi_user FOREIGN KEY (worker_id) REFERENCES users(id);