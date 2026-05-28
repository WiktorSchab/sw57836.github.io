<?php

/** @var \App\Model\Book $book */
/** @var \App\Service\Router $router */

$title = "{$book->getTitle()} ({$book->getId()})";
$bodyClass = 'show';

ob_start(); ?>
    <h1><?= $book->getTitle() ?></h1>
    <p><strong>Author:</strong> <?= $book->getAuthor() ?></p>
    <article>
        <?= $book->getDescription();?>
    </article>

    <ul class="action-list">
        <li> <a href="<?= $router->generatePath('book-index') ?>">Back to list</a></li>
        <li><a href="<?= $router->generatePath('book-edit', ['id'=> $book->getId()]) ?>">Edit</a></li>
    </ul>
<?php $main = ob_get_clean();

include __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'base.html.php';

