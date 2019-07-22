require "yaml"
require "securerandom"

SECRETS_PATH = "./config/secrets.yml"
JWT_PRIVATE_KEY = "jwt_private_key"

secrets = YAML.load_file SECRETS_PATH
updates = false

if secrets[Rails.env]
  unless secrets[Rails.env][JWT_PRIVATE_KEY]
    secrets[Rails.env][JWT_PRIVATE_KEY] = SecureRandom.hex(16)
    updates = true
  end
else
  secrets[Rails.env] = { JWT_PRIVATE_KEY => SecureRandom.hex(16) }
  updates = true
end

if updates
  puts "Generating new #{JWT_PRIVATE_KEY} for environment #{Rails.env}"
  open(SECRETS_PATH, "w") { |file| file.write(secrets.to_yaml) }
else
  puts "Using existing #{JWT_PRIVATE_KEY} for environment #{Rails.env}"
end
