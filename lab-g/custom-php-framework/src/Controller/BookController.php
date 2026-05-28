<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Book;
use App\Service\Router;
use App\Service\Templating;

class BookController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $books = Book::findAll();
        $html = $templating->render('book/index.html.php', [
            'books' => $books,
            'router' => $router,
        ]);
        return $html;
    }

    public function createAction(?array $requestBook, Templating $templating, Router $router): ?string
    {
        if ($requestBook) {
            $book = Book::fromArray($requestBook);
            // @todo missing validation
            $book->save();

            $path = $router->generatePath('book-index');
            $router->redirect($path);
            return null;
        } else {
            $book = new Book();
        }

        $html = $templating->render('book/create.html.php', [
            'book' => $book,
            'router' => $router,
        ]);
        return $html;
    }

    public function editAction(int $bookId, ?array $requestBook, Templating $templating, Router $router): ?string
    {
        $book = Book::find($bookId);
        if (! $book) {
            throw new NotFoundException("Missing book with id $bookId");
        }

        if ($requestBook) {
            $book->fill($requestBook);
            // @todo missing validation
            $book->save();

            $path = $router->generatePath('book-index');
            $router->redirect($path);
            return null;
        }

        $html = $templating->render('book/edit.html.php', [
            'book' => $book,
            'router' => $router,
        ]);
        return $html;
    }

    public function showAction(int $bookId, Templating $templating, Router $router): ?string
    {
        $book = Book::find($bookId);
        if (! $book) {
            throw new NotFoundException("Missing book with id $bookId");
        }

        $html = $templating->render('book/show.html.php', [
            'book' => $book,
            'router' => $router,
        ]);
        return $html;
    }

    public function deleteAction(int $bookId, Router $router): ?string
    {
        $book = Book::find($bookId);
        if (! $book) {
            throw new NotFoundException("Missing book with id $bookId");
        }

        $book->delete();
        $path = $router->generatePath('book-index');
        $router->redirect($path);
        return null;
    }
}

