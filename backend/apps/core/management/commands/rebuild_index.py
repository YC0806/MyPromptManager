"""
Management command to rebuild the search index from file storage.
"""
from django.core.management.base import BaseCommand
from django.conf import settings

from backend.apps.core.services.file_storage_service import FileStorageService
from backend.apps.core.services.db_index_service import DBIndexService


class Command(BaseCommand):
    help = 'Rebuild search index from file storage'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed progress',
        )

    def handle(self, *args, **options):
        verbose = options.get('verbose', False)

        self.stdout.write(self.style.WARNING('Starting index rebuild...'))

        # Initialize services
        storage = FileStorageService()
        index_service = DBIndexService()

        try:
            # Rebuild index
            stats = index_service.rebuild(storage)

            # Display results
            self.stdout.write(self.style.SUCCESS('\nRebuild complete!'))
            self.stdout.write(f"Prompts added: {stats['prompts_added']}")
            self.stdout.write(f"Templates added: {stats['templates_added']}")
            self.stdout.write(f"Chats added: {stats['chats_added']}")

            if stats['errors']:
                self.stdout.write(self.style.ERROR(f"\nErrors encountered: {len(stats['errors'])}"))
                if verbose:
                    for error in stats['errors']:
                        self.stdout.write(f"  - {error.get('type', 'unknown')}: {error.get('error')}")
            else:
                self.stdout.write(self.style.SUCCESS('No errors encountered'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Rebuild failed: {str(e)}'))
            raise
