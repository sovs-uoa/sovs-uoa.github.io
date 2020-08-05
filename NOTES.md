NOTES.md

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ git submodule update --init
Submodule 'fish' (https://github.com/jtur044/fish.git) registered for path 'fish'
Cloning into 'C:/xampp/htdocs/sovs-uoa.github.io/fish'...
Submodule path 'fish': checked out '76b2ecb3c08778a5367099dbee631b04769865ca'

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ git status
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ cd fish

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io/fish ((76b2ecb...))
$ git checkout master
Previous HEAD position was 76b2ecb no fish
Switched to branch 'master'
Your branch is up to date with 'origin/master'.

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io/fish (master)
$ git pull origin master
From https://github.com/jtur044/fish
 * branch            master     -> FETCH_HEAD
Already up to date.

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io/fish (master)
$ cd ..

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ git add fish

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ git commit -m "updated fish"
[master 2f185ee] updated fish
 1 file changed, 1 insertion(+), 1 deletion(-)

jtur044@BN337103 MINGW64 /c/xampp/htdocs/sovs-uoa.github.io (master)
$ git push
Enumerating objects: 3, done.
Counting objects: 100% (3/3), done.
Delta compression using up to 8 threads
Compressing objects: 100% (2/2), done.
Writing objects: 100% (2/2), 261 bytes | 261.00 KiB/s, done.
Total 2 (delta 1), reused 0 (delta 0)
remote: Resolving deltas: 100% (1/1), completed with 1 local object.
To https://github.com/sovs-uoa/sovs-uoa.github.io.git
   ebf58f9..2f185ee  master -> master

