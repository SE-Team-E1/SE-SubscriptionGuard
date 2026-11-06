from django.db import migrations


class Migration(migrations.Migration):

  dependencies = [
    ('auth', '0012_alter_user_first_name_max_length'),
  ]

  operations = [
    migrations.RunSQL(
      sql='CREATE UNIQUE INDEX auth_user_username_lower_uniq ON auth_user (LOWER(username));',
      reverse_sql='DROP INDEX auth_user_username_lower_uniq;',
    ),
  ]
