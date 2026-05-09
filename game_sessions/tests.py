from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from game_sessions.models import GameSession, TabletConnection, Team
from users.models import Professor
from academic.models import Faculty, Career, Course
import uuid


def make_professor_client():
    user = User.objects.create_user(username=f'prof_{uuid.uuid4().hex[:6]}', password='pass')
    professor = Professor.objects.create(user=user)
    refresh = RefreshToken.for_user(user)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(refresh.access_token)}')
    return client, professor


def make_session(professor):
    faculty = Faculty.objects.create(name='Test Faculty')
    career = Career.objects.create(name='Test Career', faculty=faculty)
    course = Course.objects.create(name='Test Course', career=career)
    session = GameSession.objects.create(
        professor=professor,
        course=course,
        room_code=f'TEST{uuid.uuid4().hex[:4].upper()}',
        status='running',
    )
    return session


class ShowResultsActionTest(TestCase):
    def setUp(self):
        self.client, self.professor = make_professor_client()
        self.session = make_session(self.professor)

    def test_set_show_results_stage(self):
        url = f'/api/sessions/game-sessions/{self.session.id}/show_results/'
        response = self.client.post(url, {'stage': 2}, format='json')
        self.assertEqual(response.status_code, 200)
        self.session.refresh_from_db()
        self.assertEqual(self.session.show_results_stage, 2)

    def test_clear_show_results_stage(self):
        self.session.show_results_stage = 3
        self.session.save()
        url = f'/api/sessions/game-sessions/{self.session.id}/show_results/'
        response = self.client.post(url, {'stage': 0}, format='json')
        self.assertEqual(response.status_code, 200)
        self.session.refresh_from_db()
        self.assertEqual(self.session.show_results_stage, 0)

    def test_invalid_stage_value(self):
        url = f'/api/sessions/game-sessions/{self.session.id}/show_results/'
        response = self.client.post(url, {'stage': 9}, format='json')
        self.assertEqual(response.status_code, 400)

    def test_requires_auth(self):
        anon_client = APIClient()
        url = f'/api/sessions/game-sessions/{self.session.id}/show_results/'
        response = anon_client.post(url, {'stage': 1}, format='json')
        self.assertIn(response.status_code, [401, 403])


class UpdateScreenActionTest(TestCase):
    def setUp(self):
        _, professor = make_professor_client()
        self.session = make_session(professor)
        self.team = Team.objects.create(
            game_session=self.session,
            name='Team A',
            color='Azul',
        )
        self.connection = TabletConnection.objects.create(
            team=self.team,
            game_session=self.session,
        )

    def test_update_screen(self):
        url = f'/api/sessions/tablet-connections/{self.connection.id}/update_screen/'
        client = APIClient()
        response = client.patch(url, {'screen': 'results_1'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.connection.refresh_from_db()
        self.assertEqual(self.connection.current_screen, 'results_1')

    def test_screen_truncated_to_50_chars(self):
        url = f'/api/sessions/tablet-connections/{self.connection.id}/update_screen/'
        client = APIClient()
        response = client.patch(url, {'screen': 'x' * 100}, format='json')
        self.assertEqual(response.status_code, 200)
        self.connection.refresh_from_db()
        self.assertEqual(len(self.connection.current_screen), 50)
