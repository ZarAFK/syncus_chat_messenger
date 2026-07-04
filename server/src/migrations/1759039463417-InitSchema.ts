import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1759039463417 implements MigrationInterface {
  name = 'InitSchema1759039463417';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_profile\` (\`profile_id\` int NOT NULL AUTO_INCREMENT, \`profile_picture\` varchar(255) NULL, \`bio\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, UNIQUE INDEX \`REL_eee360f3bff24af1b689076520\` (\`user_id\`), PRIMARY KEY (\`profile_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`auth\` (\`auth_id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`hash_password\` varchar(255) NOT NULL, \`refresh_token\` varchar(255) NULL, \`reset_password_token\` varchar(255) NULL, \`user_id\` int NOT NULL, UNIQUE INDEX \`IDX_b54f616411ef3824f6a5c06ea4\` (\`email\`), UNIQUE INDEX \`REL_9922406dc7d70e20423aeffadf\` (\`user_id\`), PRIMARY KEY (\`auth_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`media\` (\`media_id\` int NOT NULL AUTO_INCREMENT, \`url_media\` varchar(500) NULL, \`media_type\` enum ('IMAGE', 'VIDEO', 'AUDIO', 'FILE') NOT NULL, \`message_id\` int NULL, PRIMARY KEY (\`media_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`messages\` (\`id\` int NOT NULL AUTO_INCREMENT, \`content\` text NOT NULL, \`status\` enum ('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent', \`type\` enum ('text', 'image', 'video') NOT NULL DEFAULT 'text', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`sender_id\` int NULL, \`room_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (\`notification_id\` int NOT NULL AUTO_INCREMENT, \`type\` enum ('new_message', 'friend_request', 'friend_accept', 'user_blocked', 'room_invite') NOT NULL, \`related_id\` int NULL, \`message\` text NULL, \`is_read\` tinyint NOT NULL DEFAULT 0, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NULL, PRIMARY KEY (\`notification_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`user_id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`age\` int NULL, \`is_online\` tinyint NOT NULL DEFAULT 0, \`last_seen\` timestamp NULL, \`role\` enum ('admin', 'user') NOT NULL DEFAULT 'user', \`country\` enum ('Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'North Korea', 'South Korea', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe') NOT NULL, \`gender\` enum ('male', 'female', 'other') NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`status\` enum ('active', 'inactive') NOT NULL DEFAULT 'active', \`last_login\` timestamp NULL, \`profileProfileId\` int NULL, UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), UNIQUE INDEX \`REL_6165464d8ea80b128d7c2cb12d\` (\`profileProfileId\`), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rooms_category\` (\`category_room_id\` int NOT NULL AUTO_INCREMENT, \`room_tag\` enum ('game', 'music', 'project', 'community', 'friends', 'family') NOT NULL, \`description\` text NULL, PRIMARY KEY (\`category_room_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`rooms\` (\`room_id\` int NOT NULL AUTO_INCREMENT, \`room_name\` varchar(255) NOT NULL, \`room_description\` text NULL, \`age_limit\` int NOT NULL, \`rule\` text NOT NULL DEFAULT '', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`category_room_id\` int NULL, \`creator_id\` int NULL, PRIMARY KEY (\`room_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`room_members\` (\`session_member_room_id\` int NOT NULL AUTO_INCREMENT, \`joined_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`left_at\` timestamp NULL, \`user_id\` int NULL, \`room_id\` int NULL, PRIMARY KEY (\`session_member_room_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`profile_viewed\` (\`id\` int NOT NULL AUTO_INCREMENT, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`viewer_id\` int NULL, \`viewed_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`presence\` (\`presence_id\` int NOT NULL AUTO_INCREMENT, \`is_online\` tinyint NOT NULL DEFAULT 0, \`last_seen\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`room_id\` int NULL, PRIMARY KEY (\`presence_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`friends\` (\`id\` int NOT NULL AUTO_INCREMENT, \`status\` enum ('pending', 'accepted', 'rejected', 'blocked') NOT NULL DEFAULT 'pending', \`requested_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`accepted_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`friend_id\` int NULL, UNIQUE INDEX \`IDX_99b814d75e2f39700ad0e0827f\` (\`user_id\`, \`friend_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`blocked_users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`user_id\` int NULL, \`blocked_user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_favorite_rooms\` (\`user_id\` int NOT NULL, \`room_id\` int NOT NULL, INDEX \`IDX_bc47ba83ae49da15000c591d4c\` (\`user_id\`), INDEX \`IDX_efbb263677e2c8f2b10906e674\` (\`room_id\`), PRIMARY KEY (\`user_id\`, \`room_id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profile\` ADD CONSTRAINT \`FK_eee360f3bff24af1b6890765201\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`auth\` ADD CONSTRAINT \`FK_9922406dc7d70e20423aeffadf3\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`media\` ADD CONSTRAINT \`FK_a33f77c90759d1f2c799941e7db\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_22133395bd13b970ccd0c34ab22\` FOREIGN KEY (\`sender_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`messages\` ADD CONSTRAINT \`FK_1dda4fc8dbeeff2ee71f0088ba0\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`room_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` ADD CONSTRAINT \`FK_9a8a82462cab47c73d25f49261f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD CONSTRAINT \`FK_6165464d8ea80b128d7c2cb12db\` FOREIGN KEY (\`profileProfileId\`) REFERENCES \`user_profile\`(\`profile_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` ADD CONSTRAINT \`FK_f672aab92e4a1cee6fe3ddea799\` FOREIGN KEY (\`category_room_id\`) REFERENCES \`rooms_category\`(\`category_room_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` ADD CONSTRAINT \`FK_bd1f2365f91582fcdaadc7abdbe\` FOREIGN KEY (\`creator_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_members\` ADD CONSTRAINT \`FK_b2d15baf5b46ed9659bd71fbb43\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_members\` ADD CONSTRAINT \`FK_e6cf45f179a524427ddf8bacd8e\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`room_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`profile_viewed\` ADD CONSTRAINT \`FK_b5dc2fb97acfde5028b02106113\` FOREIGN KEY (\`viewer_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`profile_viewed\` ADD CONSTRAINT \`FK_b08d898f1c10d144457f346d852\` FOREIGN KEY (\`viewed_user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`presence\` ADD CONSTRAINT \`FK_2d943395d4e633af46c12d58f0f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`presence\` ADD CONSTRAINT \`FK_0ad06df2898aa609dd59d250802\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`room_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`friends\` ADD CONSTRAINT \`FK_f2534e418d51fa6e5e8cdd4b480\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`friends\` ADD CONSTRAINT \`FK_c9d447f72456a67d17ec30c5d00\` FOREIGN KEY (\`friend_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`blocked_users\` ADD CONSTRAINT \`FK_171336109e6fd263f27351b9a7a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`blocked_users\` ADD CONSTRAINT \`FK_1da464176c039aac8a7532906af\` FOREIGN KEY (\`blocked_user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_favorite_rooms\` ADD CONSTRAINT \`FK_bc47ba83ae49da15000c591d4cd\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`user_id\`) ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_favorite_rooms\` ADD CONSTRAINT \`FK_efbb263677e2c8f2b10906e674a\` FOREIGN KEY (\`room_id\`) REFERENCES \`rooms\`(\`room_id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_favorite_rooms\` DROP FOREIGN KEY \`FK_efbb263677e2c8f2b10906e674a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_favorite_rooms\` DROP FOREIGN KEY \`FK_bc47ba83ae49da15000c591d4cd\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`blocked_users\` DROP FOREIGN KEY \`FK_1da464176c039aac8a7532906af\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`blocked_users\` DROP FOREIGN KEY \`FK_171336109e6fd263f27351b9a7a\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`friends\` DROP FOREIGN KEY \`FK_c9d447f72456a67d17ec30c5d00\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`friends\` DROP FOREIGN KEY \`FK_f2534e418d51fa6e5e8cdd4b480\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`presence\` DROP FOREIGN KEY \`FK_0ad06df2898aa609dd59d250802\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`presence\` DROP FOREIGN KEY \`FK_2d943395d4e633af46c12d58f0f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`profile_viewed\` DROP FOREIGN KEY \`FK_b08d898f1c10d144457f346d852\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`profile_viewed\` DROP FOREIGN KEY \`FK_b5dc2fb97acfde5028b02106113\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_members\` DROP FOREIGN KEY \`FK_e6cf45f179a524427ddf8bacd8e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`room_members\` DROP FOREIGN KEY \`FK_b2d15baf5b46ed9659bd71fbb43\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` DROP FOREIGN KEY \`FK_bd1f2365f91582fcdaadc7abdbe\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`rooms\` DROP FOREIGN KEY \`FK_f672aab92e4a1cee6fe3ddea799\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_6165464d8ea80b128d7c2cb12db\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`notifications\` DROP FOREIGN KEY \`FK_9a8a82462cab47c73d25f49261f\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_1dda4fc8dbeeff2ee71f0088ba0\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`messages\` DROP FOREIGN KEY \`FK_22133395bd13b970ccd0c34ab22\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`media\` DROP FOREIGN KEY \`FK_a33f77c90759d1f2c799941e7db\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`auth\` DROP FOREIGN KEY \`FK_9922406dc7d70e20423aeffadf3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_profile\` DROP FOREIGN KEY \`FK_eee360f3bff24af1b6890765201\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_efbb263677e2c8f2b10906e674\` ON \`user_favorite_rooms\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_bc47ba83ae49da15000c591d4c\` ON \`user_favorite_rooms\``,
    );
    await queryRunner.query(`DROP TABLE \`user_favorite_rooms\``);
    await queryRunner.query(`DROP TABLE \`blocked_users\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_99b814d75e2f39700ad0e0827f\` ON \`friends\``,
    );
    await queryRunner.query(`DROP TABLE \`friends\``);
    await queryRunner.query(`DROP TABLE \`presence\``);
    await queryRunner.query(`DROP TABLE \`profile_viewed\``);
    await queryRunner.query(`DROP TABLE \`room_members\``);
    await queryRunner.query(`DROP TABLE \`rooms\``);
    await queryRunner.query(`DROP TABLE \`rooms_category\``);
    await queryRunner.query(
      `DROP INDEX \`REL_6165464d8ea80b128d7c2cb12d\` ON \`users\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``,
    );
    await queryRunner.query(`DROP TABLE \`users\``);
    await queryRunner.query(`DROP TABLE \`notifications\``);
    await queryRunner.query(`DROP TABLE \`messages\``);
    await queryRunner.query(`DROP TABLE \`media\``);
    await queryRunner.query(
      `DROP INDEX \`REL_9922406dc7d70e20423aeffadf\` ON \`auth\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_b54f616411ef3824f6a5c06ea4\` ON \`auth\``,
    );
    await queryRunner.query(`DROP TABLE \`auth\``);
    await queryRunner.query(
      `DROP INDEX \`REL_eee360f3bff24af1b689076520\` ON \`user_profile\``,
    );
    await queryRunner.query(`DROP TABLE \`user_profile\``);
  }
}
